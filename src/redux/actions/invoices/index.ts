import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Dispatch, AnyAction } from "redux";
import { ThunkAction } from "redux-thunk";
import { db, auth, storage } from "../../../firebase";
import {
  uploadBytes,
  ref,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  writeBatch,
  where,
  query,
  Timestamp,
} from "firebase/firestore";
import { Invoice, RootState, InvoiceExpenses } from "../../../interfaces";

export const POST_INVOICE = "POST_INVOICE";
export const GET_INVOICE = "GET_INVOICE";
export const GET_INVOICE_DETAILS = "GET_INVOICE_DETAILS";
export const DELETE_INVOICE = "DELETE_INVOICE";

export function postInvoice(
  invoice: Invoice | InvoiceExpenses,
  image: File | null
): ThunkAction<Promise<void>, RootState, null, AnyAction> {
  return async (dispatch: Dispatch<AnyAction>) => {
    try {
      if (auth.currentUser === null) throw new Error("unauthenticated user");

      // Date destructuring
      const date: string[] = invoice.date
        .toDate()
        .toISOString()
        .split("T")[0]
        .split("-");
      const year: string = date[0];
      const month: string = date[1];

      let dir: string = "";
      let imageUrl: string = "";

      if (image) {
        // Set directory
        dir = `${auth.currentUser.uid}/${year}/${month}/${invoice.id}`;

        // POST invoice image
        const storageRef = ref(storage, dir);
        const imageQuery = await uploadBytes(storageRef, image);

        // GET invoice image url
        imageUrl = await getDownloadURL(imageQuery.ref);
      }

      // New object with all data
      const newInvoice: Invoice | InvoiceExpenses = {
        ...invoice,
        image: imageUrl,
        imageRef: dir,
      };

      // Save invoice data
      const invoiceRef = collection(
        db,
        "Users",
        auth.currentUser.uid,
        "Invoices"
      );
      await setDoc(doc(invoiceRef, invoice.id.toString()), newInvoice);

      dispatch({
        type: POST_INVOICE,
        payload: newInvoice,
      });
    } catch (e: any) {
      throw new Error(e);
    }
  };
}

export function getInvoices(
  year: string | number,
  month: string | number | null
): ThunkAction<Promise<void>, RootState, null, AnyAction> {
  return async (dispatch: Dispatch<AnyAction>) => {
    try {
      if (auth.currentUser === null) throw new Error("unauthenticated user");

      const invoiceRef = collection(
        db,
        "Users",
        auth.currentUser.uid,
        "Invoices"
      );

      // Date range
      let startDate: Date;
      let endDate: Date;

      // Per year or month
      if (month !== null) {
        startDate = startOfMonth(new Date(Number(year), Number(month) - 1));
        endDate = endOfMonth(new Date(Number(year), Number(month) - 1));
      } else {
        startDate = startOfYear(new Date(Number(year), 0));
        endDate = endOfYear(new Date(Number(year), 11));
      }

      // Calculate UTC start and end dates
      const utcStartDate = new Date(
        startDate.getTime() - startDate.getTimezoneOffset() * 60000
      );
      const utcEndDate = new Date(
        endDate.getTime() - endDate.getTimezoneOffset() * 60000
      );

      // Convert to firebase Timestamp
      const startTimeStamp = Timestamp.fromDate(utcStartDate);
      const endTimeStamp = Timestamp.fromDate(utcEndDate);

      // Query and get docs
      const snapshot = await getDocs(
        query(
          invoiceRef,
          where("date", ">=", startTimeStamp),
          where("date", "<=", endTimeStamp)
        )
      );

      // Get data
      let invoices: any = [];
      snapshot.forEach((doc: any) => {
        invoices.push(doc.data());
      });

      dispatch({
        type: GET_INVOICE,
        payload: invoices,
      });
    } catch (e: any) {
      throw new Error(e);
    }
  };
}

export function getInvoiceDetails(
  isItem: boolean,
  invoiceId: number
): ThunkAction<Promise<void>, RootState, null, AnyAction> {
  return async (dispatch: Dispatch<AnyAction>) => {
    try {
      if (auth.currentUser === null) throw new Error("unauthenticated user");

      const itemsRef = collection(db, "Users", auth.currentUser.uid, "Items");

      const expensesRef = collection(
        db,
        "Users",
        auth.currentUser.uid,
        "Expenses"
      );

      // Query and get docs
      let snapshot = await getDocs(
        query(
          isItem ? itemsRef : expensesRef,
          where("invoiceId", "==", invoiceId)
        )
      );

      // Get data
      let data: any = [];
      snapshot.forEach((doc: any) => {
        data.push(doc.data());
      });

      dispatch({
        type: GET_INVOICE_DETAILS,
        payload: data,
      });
    } catch (e: any) {
      throw new Error(e);
    }
  };
}

export function deleteInvoice(
  invoice: Invoice | InvoiceExpenses
): ThunkAction<Promise<void>, RootState, null, AnyAction> {
  return async (dispatch: Dispatch<AnyAction>) => {
    try {
      if (auth.currentUser === null) throw new Error("unauthenticated user");

      const invoiceRef = collection(
        db,
        "Users",
        auth.currentUser.uid,
        "Invoices"
      );
      const itemsRef = collection(db, "Users", auth.currentUser.uid, "Items");
      const expensesRef = collection(
        db,
        "Users",
        auth.currentUser.uid,
        "Expenses"
      );

      const batch = writeBatch(db);

      // Delete invoice
      batch.delete(doc(invoiceRef, invoice.id.toString()));

      // Get items
      const itemsQuery = query(itemsRef, where("invoiceId", "==", invoice.id));
      const itemSnapshot = await getDocs(itemsQuery);

      // Delete items
      itemSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      let itemsId: string[] = [];
      itemSnapshot.forEach((doc) => itemsId.push(doc.id));

      // Get expenses and then delete them
      for (let i = 0; i < itemsId.length; i++) {
        // Get sales matching id
        const expensesQuery = query(expensesRef, where("id", "==", itemsId[i]));
        const expensesToDelete = await getDocs(expensesQuery);
        // Delete sales
        if (!expensesToDelete.empty) {
          expensesToDelete.forEach((doc) => {
            batch.delete(doc.ref);
          });
        }
      }

      // SALES
      const salesRef = collection(db, "Users", auth.currentUser.uid, "Sales");
      for (let i = 0; i < itemsId.length; i++) {
        // Get sales matching id
        const salesQuery = query(salesRef, where("id", "==", itemsId[i]));
        const salesToDelete = await getDocs(salesQuery);

        // Delete sales
        if (!salesToDelete.empty) {
          salesToDelete.forEach((doc) => {
            batch.delete(doc.ref);
          });
        }
      }

      await batch.commit();

      // Delete the file, invoice image
      if (invoice.imageRef !== "") {
        const desertRef = ref(storage, invoice.imageRef);
        await deleteObject(desertRef);
      }

      dispatch({
        type: DELETE_INVOICE,
        payload: invoice,
      });
    } catch (e: any) {
      throw new Error(e);
    }
  };
}

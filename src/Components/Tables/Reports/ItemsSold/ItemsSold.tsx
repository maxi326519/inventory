import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Item, RootState } from "../../../../interfaces";
import { getFirstAndLastDayOfMonth } from "../../../../functions/date";

import Table from "./Table/Table";
import Excel from "./Excel/Excel.jsx";

import styles from "./ItemsSold.module.css";

interface Dates {
  firstDay: string;
  lastDay: string;
}

const initialDates: Dates = getFirstAndLastDayOfMonth(new Date());

export default function ItemsSold() {
  const items: Item[] = useSelector((state: RootState) => state.items);
  const [itemsSold, setItemSold] = useState<Item[]>([]);
  const [dates, setDates] = useState(initialDates);
  const [total, setTotal] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    setItemSold(
      filterAndSortItems(
        dates.firstDay,
        dates.lastDay,
        items.filter((i) => i.state === "Sold")
      )
    );
  }, [items, dates]);

  useEffect(() => {
    let total = 0;
    let totaltems = 0;
    itemsSold.forEach((item) => {total += Number(item.cost); totaltems++});
    setTotal(total);
    setTotalItems(totaltems);
  }, [itemsSold])

  function filterAndSortItems(
    dateFrom: string,
    dateTo: string,
    items: Item[]
  ): Item[] {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    // Filtrar los elementos que estén dentro del rango de fechas
    const filteredItems = items.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= fromDate && itemDate <= toDate;
    });

    // Ordenar los elementos por fecha de mayor a menor
    filteredItems.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    return filteredItems;
  }

  function handleChangeDate(event: React.ChangeEvent<HTMLInputElement>) {
    const name = event.target.name;
    const value = event.target.value;
    setDates({ ...dates, [name]: value });
  }

  return (
    <div className={styles.itemsSold}>
      <div className={styles.controls}>
        <div className="form-floating">
          <input
            className="form-control"
            id="formDate"
            name="firstDay"
            type="date"
            value={dates.firstDay}
            onChange={handleChangeDate}
          />
          <label className="form-label" htmlFor="formDate">
            From:
          </label>
        </div>
        <div className="form-floating">
          <input
            className="form-control"
            id="toDate"
            name="lastDay"
            type="date"
            value={dates.lastDay}
            onChange={handleChangeDate}
          />
          <label className="form-label" htmlFor="toDate">
            From:
          </label>
        </div>
        <Excel sales={itemsSold} />
        <span className={styles.total}>Total items: {totalItems}</span>
        <span className={styles.total}>Total cost: ${Number(total).toFixed(2)}</span>
        <span className={styles.total}>Order total: 0</span>
      </div>
      <Table items={itemsSold} />
    </div>
  );
}

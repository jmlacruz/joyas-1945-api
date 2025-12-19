import { mySQLActions } from "./mySQLActions";

let  dao: mySQLActions | null = null;

export const getDao = () => {
    if (!dao) {
        dao = new mySQLActions();
        return dao;
    } else {
        return dao;
    }
};
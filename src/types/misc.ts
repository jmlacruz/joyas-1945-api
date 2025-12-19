export interface FutureDateForCronJob {
    mdays: number;
    months: number;
    hours: number;
    minutes: number;
    wdays: number;
}

export type ContactFormValues = {
    name: string,
    last_name: string,
    email: string,
    message: string,
}

export type ProductDataForSync = {
    codigo: string;
    precio: number;
}

export type ClientDataForSync = {
    email: string;
    vendedor: number;
}


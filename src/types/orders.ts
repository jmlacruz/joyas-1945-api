export type PaymentOptions = "Lo resuelvo personalmente" | "Transferencia o depósito bancario" | "";
export type BuyerTypeOptions = "Monotributista" | "Responsable Inscripto" | "Consumidor Final" | "";

export type BuyerData =  {
    "": "",
    "CUIT": string,
    "DNI": string,
    "Razón Social": string,
    "Nombre Completo": string,
}

export type OrderData = {
    shippingMethodID: number | null
    paymentMethod: PaymentOptions,
    buyerType: BuyerTypeOptions,
    buyerData: BuyerData,
    clientIP: string | null,
}   

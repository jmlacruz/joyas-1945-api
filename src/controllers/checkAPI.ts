import { Request, Response } from "express";

export const checkAPI = (_req: Request, res: Response) => {
    res.send("API is working");
};
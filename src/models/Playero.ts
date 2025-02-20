import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPlayero extends Document {
    nombre: string;     // Almacenado en mayúsculas
    documento: string;
}

const PlayeroSchema = new Schema<IPlayero>({
    nombre: { type: String, required: true },
    documento: { type: String, required: true, unique: true },
});

export default mongoose.models.Playero || mongoose.model<IPlayero>("Playero", PlayeroSchema, "playeros");

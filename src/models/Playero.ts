import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPlayero extends Document {
    nombre: string;
    documento: string;
    ubicacionId?: Types.ObjectId; 
}

const PlayeroSchema = new Schema<IPlayero>({
    nombre: { type: String, required: true },
    documento: { type: String, required: true, unique: true },
    ubicacionId: { type: Schema.Types.ObjectId, ref: "Ubicacion", required: false },
});

export default mongoose.models.Playero ||
    mongoose.model<IPlayero>("Playero", PlayeroSchema, "playeros");

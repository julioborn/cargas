import mongoose, { Schema, Document } from "mongoose";

export interface IUbicacion extends Document {
    nombre: string;
}

const UbicacionSchema = new Schema<IUbicacion>({
    nombre: { type: String, required: true, unique: true },
});

export default mongoose.models.Ubicacion || mongoose.model<IUbicacion>("Ubicacion", UbicacionSchema, "ubicaciones");

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUnidad extends Document {
    empresaId: Types.ObjectId;
    matricula: string;
    tipo: "CAMION" | "COLECTIVO" | "UTILITARIO" | "AUTOMOVIL" | "MOTO";
}

const UnidadSchema = new Schema<IUnidad>({
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: true },
    matricula: { type: String, required: true, unique: true },
    tipo: { 
        type: String, 
        enum: ["CAMION", "COLECTIVO", "UTILITARIO", "AUTOMOVIL", "MOTO"], 
        required: true,
        set: (v: string) => v.toUpperCase(), // 🔹 Convierte a mayúsculas antes de guardar
    },
}, { collection: "unidades" }); // 🔹 Forzar nombre de la colección

export default mongoose.models.Unidad || mongoose.model<IUnidad>("Unidad", UnidadSchema, 'unidades');
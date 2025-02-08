import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUnidad extends Document {
    empresaId: Types.ObjectId;
    matricula: string;
    tipo: "CAMION" | "COLECTIVO" | "UTILITARIO" | "AUTOMOVIL" | "MOTO";
    choferAsignado?: Types.ObjectId; // ✅ Nuevo campo
}

const UnidadSchema = new Schema<IUnidad>({
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: true },
    matricula: { type: String, required: true, unique: true },
    tipo: {
        type: String, 
        enum: ["CAMION", "COLECTIVO", "UTILITARIO", "AUTOMOVIL", "MOTO"], 
        required: true,
        set: (v: string) => v.toUpperCase(),
    },
    choferAsignado: { type: Schema.Types.ObjectId, ref: "Chofer", default: null }, // ✅ Referencia a chofer
}, { collection: "unidades" });

export default mongoose.models.Unidad || mongoose.model<IUnidad>("Unidad", UnidadSchema, 'unidades');

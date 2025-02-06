import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrden extends Document {
    empresaId: Types.ObjectId;
    unidad: string;
    litros: number;
    precio: number;
    estado: "pendiente" | "completada";
    fecha: Date;
}

const OrdenSchema = new Schema<IOrden>({
    empresaId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    unidad: { type: String, required: true },
    litros: { type: Number, required: true },
    precio: { type: Number, required: true },
    estado: { type: String, enum: ["pendiente", "completada"], default: "pendiente" },
    fecha: { type: Date, default: Date.now },
});

export default mongoose.models.Orden || mongoose.model<IOrden>("Orden", OrdenSchema);

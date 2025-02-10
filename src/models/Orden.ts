import mongoose, { Schema, Document } from "mongoose";

interface IOrden extends Document {
    empresaId: mongoose.Types.ObjectId;
    fechaEmision: Date;
    fechaCarga?: Date;
    unidadId: mongoose.Types.ObjectId;
    choferId: mongoose.Types.ObjectId;
    producto: "GASOIL_G2" | "GASOIL_G3" | "NAFTA_SUPER" | "NAFTA_ECO";
    litros?: number;
    monto?: number;
    estado: "PENDIENTE_AUTORIZACION" | "PENDIENTE_CARGA" | "CARGA_COMPLETADA";
}

const OrdenSchema = new Schema<IOrden>({
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: true }, // ✅ Asegurar que es requerido
    fechaEmision: { type: Date, default: Date.now },
    fechaCarga: { type: Date },
    unidadId: { type: Schema.Types.ObjectId, ref: "Unidad", required: true },
    choferId: { type: Schema.Types.ObjectId, ref: "Chofer", required: true },
    producto: {
        type: String,
        enum: ["GASOIL_G2", "GASOIL_G3", "NAFTA_SUPER", "NAFTA_ECO"],
        required: true,
    },
    litros: { type: Number },
    monto: { type: Number },
    estado: {
        type: String,
        enum: ["PENDIENTE_AUTORIZACION", "PENDIENTE_CARGA", "CARGA_COMPLETADA"],
        default: "PENDIENTE_AUTORIZACION",
    },
});

export default mongoose.models.Orden || mongoose.model<IOrden>("Orden", OrdenSchema, "ordenes");

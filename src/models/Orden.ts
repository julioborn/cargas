import mongoose, { Schema, Document } from "mongoose";

interface IOrden extends Document {
    fechaEmision: Date;
    fechaCarga?: Date;
    unidadId: mongoose.Types.ObjectId;
    choferId: mongoose.Types.ObjectId;
    producto: "GASOIL_G2" | "GASOIL_G3" | "NAFTA_SUPER" | "NAFTA_ECO";
    litros?: number;
    monto?: number;
    estado: "PENDIENTE_AUTORIZACION" | "AUTORIZADA" | "PENDIENTE_CARGA" | "CARGA_FINALIZADA";
}

const OrdenSchema = new Schema<IOrden>({
    fechaEmision: { type: Date, default: Date.now }, // Se genera automáticamente
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
        enum: ["PENDIENTE_AUTORIZACION", "AUTORIZADA", "PENDIENTE_CARGA", "CARGA_FINALIZADA"],
        default: "PENDIENTE_AUTORIZACION",
    },
});

export default mongoose.models.Orden || mongoose.model<IOrden>("Orden", OrdenSchema, "ordenes");

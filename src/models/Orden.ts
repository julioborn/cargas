import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6); // Solo letras mayúsculas y números

const OrdenSchema = new mongoose.Schema({
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", required: true },
    unidadId: { type: mongoose.Schema.Types.ObjectId, ref: "Unidad" },
    choferId: { type: mongoose.Schema.Types.ObjectId, ref: "Chofer" },
    producto: { type: String, required: true },
    litros: { type: Number, required: true },
    monto: { type: Number, required: true },
    fechaEmision: { type: Date, default: Date.now },
    fechaCarga: { type: Date },
    estado: { 
        type: String, 
        enum: ["PENDIENTE", "AUTORIZADA", "CARGADA"], 
        default: "PENDIENTE" 
    },
    codigoOrden: { type: String, unique: true } 
});

// Middleware para generar el código antes de guardar
OrdenSchema.pre("save", function (next) {
    if (!this.codigoOrden) {
        this.codigoOrden = nanoid();
    }
    next();
});

export default mongoose.models.Orden || mongoose.model("Orden", OrdenSchema, 'ordenes');

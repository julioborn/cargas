import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

const OrdenSchema = new mongoose.Schema({
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", required: true },
    unidadId: { type: mongoose.Schema.Types.ObjectId, ref: "Unidad" },
    choferId: { type: mongoose.Schema.Types.ObjectId, ref: "Chofer" },
    producto: { type: String, required: true },

    tanqueLleno: { type: Boolean, default: false }, // Opción "Tanque Lleno"
    litros: { type: Number, default: null, required: false }, // Permite null
    importe: { type: Number, default: null, required: false }, // Permite null

    condicionPago: {
        type: String,
        enum: ["Cuenta Corriente", "Pago Anticipado"],
        required: true // Obligatoria
    },

    fechaEmision: { type: Date, default: Date.now },
    fechaCarga: { type: Date },

    estado: {
        type: String,
        enum: ["PENDIENTE_AUTORIZACION", "AUTORIZADA", "CARGADA"],
        default: "PENDIENTE_AUTORIZACION"
    },

    codigoOrden: { type: String, unique: true },
    playeroId: { type: mongoose.Schema.Types.ObjectId, ref: "Playero" } // NUEVO: referencia al playero
});

// Middleware para validar combinaciones inválidas
OrdenSchema.pre("save", function (next) {
    if (!this.codigoOrden) {
        this.codigoOrden = nanoid();
    }

    const hasLitros = typeof this.litros === "number" && this.litros > 0;
    const hasImporte = typeof this.importe === "number" && this.importe > 0;
    const hasTanqueLleno = this.tanqueLleno === true;

    if ((hasLitros && (hasImporte || hasTanqueLleno)) || (hasImporte && hasTanqueLleno)) {
        return next(new Error("Solo puedes elegir una opción: litros, importe o tanque lleno."));
    }

    if (hasTanqueLleno) {
        this.litros = undefined;
        this.importe = undefined;
    }
    if (hasImporte) {
        this.litros = undefined;
        this.tanqueLleno = false;
    }
    if (hasLitros) {
        this.importe = undefined;
        this.tanqueLleno = false;
    }
    next();
});

export default mongoose.models.Orden || mongoose.model("Orden", OrdenSchema, "ordenes");

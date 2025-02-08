import mongoose, { Schema, Document } from "mongoose";

interface IChofer extends Document {
    empresaId: mongoose.Types.ObjectId;
    nombre: string;
    documento: string;
}

const ChoferSchema = new Schema<IChofer>({
    empresaId: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", required: true }, // 🔹 Relación con Empresa
    nombre: { type: String, required: true },
    documento: { type: String, required: true, unique: true },
});

export default mongoose.models.Chofer || mongoose.model<IChofer>("Chofer", ChoferSchema, "choferes");

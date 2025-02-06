import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUsuario extends Document {
    _id: Types.ObjectId;
    nombre: string;
    email: string;
    password: string;
    rol: "admin" | "empresa";
    empresaId?: Types.ObjectId; // Relación con la empresa
}

const UsuarioSchema = new Schema<IUsuario>({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ["admin", "empresa"], required: true },
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: false },
});

export default mongoose.models.Usuario || mongoose.model<IUsuario>("Usuario", UsuarioSchema);

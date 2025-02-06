import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEmpresa extends Document {
    _id: Types.ObjectId;
    nombre: string;
    ruc_cuit: string;
    direccion: string;
    telefono: string;
    propietarioId: Types.ObjectId; // Usuario que creó la empresa
}

const EmpresaSchema = new Schema<IEmpresa>({
    nombre: { type: String, required: true },
    ruc_cuit: { type: String, required: true, unique: true },
    direccion: { type: String, required: true },
    telefono: { type: String, required: true },
    propietarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
});

export default mongoose.models.Empresa || mongoose.model<IEmpresa>("Empresa", EmpresaSchema);

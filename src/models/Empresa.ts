import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEmpresa extends Document {
    _id: Types.ObjectId;
    nombre: string;
    ruc_cuit: string;
    direccion: string;
    telefono: string;
    propietarioId: Types.ObjectId; // Usuario que creó la empresa
    ciudad: string; // Nueva propiedad para la ciudad
    pais: string;   // Nueva propiedad para el país
}

const EmpresaSchema = new Schema<IEmpresa>({
    nombre: { type: String, required: true },
    ruc_cuit: { type: String, required: true, unique: true },
    direccion: { type: String, required: true },
    telefono: { type: String, required: true },
    propietarioId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    ciudad: { type: String, required: true }, // Agregamos la ciudad
    pais: { type: String, required: true },   // Agregamos el país
});

export default mongoose.models.Empresa || mongoose.model<IEmpresa>("Empresa", EmpresaSchema);

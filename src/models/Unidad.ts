import mongoose, { Schema, Document } from "mongoose";

interface IUnidad extends Document {
    empresaId: string;
    matricula: string;
    tipo: string;
    choferAnexado?: string; // Nuevo campo para el chofer anexado
}

const UnidadSchema = new Schema<IUnidad>({
    empresaId: { type: String, required: true },
    matricula: { type: String, required: true, unique: true },
    tipo: { type: String, required: true },
    choferAnexado: { type: String, default: null } // Inicialmente vacío
});

export default mongoose.models.Unidad || mongoose.model<IUnidad>("Unidad", UnidadSchema, 'unidades');

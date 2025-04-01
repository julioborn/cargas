import mongoose, { Schema, Document } from "mongoose";

export interface IEmpleado extends Document {
    empresaId: mongoose.Types.ObjectId;
    nombre: string;
    documento: string;
}

const EmpleadoSchema = new Schema<IEmpleado>({
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: true },
    nombre: { type: String, required: true },
    documento: { type: String, required: true },
});

export default mongoose.models.Empleado || mongoose.model<IEmpleado>("Empleado", EmpleadoSchema, "empleados");

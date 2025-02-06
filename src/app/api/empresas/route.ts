import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Empresa from "@/models/Empresa";
import Usuario from "@/models/Usuario";
import mongoose from "mongoose"; // Importar mongoose para convertir el ID

export async function POST(req: Request) {
    try {
        await connectMongoDB();
        const { nombre, ruc_cuit, direccion, telefono, propietarioId } = await req.json();

        // Convertir propietarioId a ObjectId
        if (!mongoose.Types.ObjectId.isValid(propietarioId)) {
            return NextResponse.json({ error: "ID de usuario inválido." }, { status: 400 });
        }

        const propietarioObjectId = new mongoose.Types.ObjectId(propietarioId);

        // Verificar si ya existe una empresa con ese RUC/CUIT
        const empresaExistente = await Empresa.findOne({ ruc_cuit });
        if (empresaExistente) {
            return NextResponse.json({ error: "Esta empresa ya está registrada." }, { status: 400 });
        }

        // Crear la empresa
        const nuevaEmpresa = new Empresa({
            nombre,
            ruc_cuit,
            direccion,
            telefono,
            propietarioId: propietarioObjectId,
        });

        const empresaGuardada = await nuevaEmpresa.save();

        // Asociar la empresa al usuario
        await Usuario.findByIdAndUpdate(propietarioObjectId, { empresaId: empresaGuardada._id });

        return NextResponse.json({ message: "Empresa creada exitosamente", empresa: empresaGuardada }, { status: 201 });
    } catch (error) {
        console.error("❌ Error creando empresa:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

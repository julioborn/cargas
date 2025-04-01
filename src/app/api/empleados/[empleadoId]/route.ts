import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Empleado from "@/models/Empleado";

export async function PUT(req: Request, { params }: { params: { empleadoId: string } }) {
    await connectMongoDB();

    try {
        const { nombre, documento } = await req.json();

        const  empleadoActualizado = await Empleado.findByIdAndUpdate(
            params.empleadoId,
            { nombre, documento },
            { new: true }
        );

        if (!empleadoActualizado) {
            return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ message: "Empleado actualizado", empleado: empleadoActualizado }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar empleado" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { empleadoId: string } }) {
    await connectMongoDB();

    try {
        const empleadoEliminado = await Empleado.findByIdAndDelete(params.empleadoId);

        if (!empleadoEliminado) {
            return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ message: "Empleado eliminado" }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar empleado" }, { status: 500 });
    }
}

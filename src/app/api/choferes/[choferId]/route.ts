import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Chofer from "@/models/Chofer";

// 📌 Editar un chofer
export async function PUT(req: Request, context: { params: { choferId: string } }) {
    await connectMongoDB();

    try {
        const { nombre, documento } = await req.json();

        const choferActualizado = await Chofer.findByIdAndUpdate(
            context.params.choferId, // ✅ Usa `context.params.choferId`
            { nombre, documento },
            { new: true }
        );

        if (!choferActualizado) {
            return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ message: "Chofer actualizado", chofer: choferActualizado }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar chofer" }, { status: 500 });
    }
}

// 📌 Eliminar un chofer
export async function DELETE(req: Request, context: { params: { choferId: string } }) {
    await connectMongoDB();

    try {
        const choferEliminado = await Chofer.findByIdAndDelete(context.params.choferId);

        if (!choferEliminado) {
            return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ message: "Chofer eliminado" }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar chofer" }, { status: 500 });
    }
}

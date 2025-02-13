import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Chofer from "@/models/Chofer";

// 📌 Editar un chofer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(req: Request, { params }: { params: { choferId: string } }) {
    await connectMongoDB();

    try {
        const { nombre, documento } = await req.json();

        const choferActualizado = await Chofer.findByIdAndUpdate(
            params.choferId,
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
export async function DELETE(req: Request, { params }: { params: { choferId: string } }) {
    await connectMongoDB();

    try {
        const choferEliminado = await Chofer.findByIdAndDelete(params.choferId);

        if (!choferEliminado) {
            return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ message: "Chofer eliminado" }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar chofer" }, { status: 500 });
    }
}

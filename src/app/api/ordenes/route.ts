import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Orden from "@/models/Orden";
import { connectMongoDB } from "@/lib/mongodb";

export async function GET() {
    try {
        await connectMongoDB();
        const ordenes = await Orden.find().populate("unidadId choferId");
        return NextResponse.json(ordenes);
    } catch (error) {
        console.error("❌ Error al obtener órdenes:", error);
        return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectMongoDB();
        const body = await req.json();

        // Validación básica
        if (!body.unidadId || !body.choferId || !body.producto) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        const newOrden = new Orden({
            fechaEmision: new Date(),
            unidadId: new mongoose.Types.ObjectId(body.unidadId),
            choferId: new mongoose.Types.ObjectId(body.choferId),
            producto: body.producto,
            litros: body.litros || null,
            monto: body.monto || null,
            estado: body.estado || "PENDIENTE_AUTORIZACION",
        });

        await newOrden.save();
        return NextResponse.json(newOrden);
    } catch (error) {
        console.error("❌ Error al crear orden:", error);
        return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 });
    }
}

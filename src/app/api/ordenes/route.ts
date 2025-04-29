import mongoose from "mongoose";
import { nanoid } from "nanoid";
import Orden from "@/models/Orden";
import Unidad from "@/models/Unidad";
import Chofer from "@/models/Chofer";
import Empresa from "@/models/Empresa";
console.log("Empresa model registrado:", Empresa.modelName);
import Ubicacion from "@/models/Ubicacion";
import "@/models/Ubicacion"; // Para registrar el modelo Ubicacion
import { connectMongoDB } from "@/lib/mongodb";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        await connectMongoDB();

        // Obtiene el token para identificar al usuario
        const token = await getToken({
            req: req as any,
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: process.env.NODE_ENV === "production",
        });

        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get("empresaId");
        const estado = searchParams.get("estado");
        const fechaDesde = searchParams.get("fechaDesde");
        const fechaHasta = searchParams.get("fechaHasta");

        let query: any = {};

        if (token?.role === "chofer") {
            query.choferId = token.id;
            query.estado = "AUTORIZADA";
        } else if (token?.role === "playero") {
            query.estado = "AUTORIZADA";
        } else {
            if (empresaId && mongoose.isValidObjectId(empresaId)) {
                query.empresaId = new mongoose.Types.ObjectId(empresaId);
            }
            if (estado) query.estado = estado;
            if (fechaDesde || fechaHasta) {
                query.fechaEmision = {};
                if (fechaDesde) query.fechaEmision.$gte = new Date(fechaDesde);
                if (fechaHasta) query.fechaEmision.$lte = new Date(fechaHasta);
            }
        }

        console.log("🔍 Filtro aplicado:", query);

        const ordenes = await Orden.find(query)
            .populate("empresaId")
            .populate("unidadId", "matricula")
            .populate("choferId", "nombre documento")
            .populate("playeroId", "nombre documento")
            .populate("ubicacionId", "nombre")
            .lean();

        return NextResponse.json(ordenes);
    } catch (error) {
        console.error("❌ Error obteniendo órdenes:", error);
        return NextResponse.json({ error: "Error obteniendo órdenes" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectMongoDB();
        const body = await req.json();

        if (!body.empresaId) {
            return NextResponse.json({ error: "empresaId es requerido" }, { status: 400 });
        }
        if (!body.condicionPago) {
            return NextResponse.json({ error: "condicionPago es requerido" }, { status: 400 });
        }

        // Validar que solo se envíe una opción entre tanqueLleno, litros y monto
        const hasTanqueLleno = body.tanqueLleno === true;
        const hasLitros = typeof body.litros === "number" && body.litros > 0;
        const hasMonto = typeof body.monto === "number" && body.monto > 0;

        if ((hasTanqueLleno && (hasLitros || hasMonto)) || (hasLitros && hasMonto)) {
            return NextResponse.json(
                { error: "Solo puedes elegir una opción: litros, importe o tanque lleno." },
                { status: 400 }
            );
        }

        const idUnico = nanoid(6).replace(/[^A-Z0-9]/g, "");

        // Si no se envía unidad, se asigna la primera encontrada para esa empresa
        let unidadAsignada = null;
        if (!body.unidadId) {
            unidadAsignada = await Unidad.findOne({ empresaId: body.empresaId });
        }
        // Si no se envía chofer, se asigna el primero encontrado para esa empresa
        let choferAsignado = null;
        if (!body.choferId) {
            choferAsignado = await Chofer.findOne({ empresaId: body.empresaId });
        }

        const nuevaOrden = new Orden({
            idUnico,
            empresaId: mongoose.isValidObjectId(body.empresaId)
                ? new mongoose.Types.ObjectId(body.empresaId)
                : body.empresaId,
            unidadId: body.unidadId || unidadAsignada?._id,
            choferId: body.choferId || choferAsignado?._id,
            producto: body.producto,
            litros: hasLitros ? body.litros : undefined,
            monto: hasMonto ? body.monto : undefined,
            tanqueLleno: hasTanqueLleno ? true : false,
            fechaCarga: body.fechaCarga,
            condicionPago: body.condicionPago,
            // Nuevo campo: viaticos (opcional)
            viaticos: body.viaticos,
            estado: "PENDIENTE_AUTORIZACION",
        });

        await nuevaOrden.save();
        console.log("✅ Orden guardada con ID:", idUnico);

        return NextResponse.json(nuevaOrden);
    } catch (error) {
        console.error("❌ Error al crear orden:", error);
        return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        await connectMongoDB();
        const { id, nuevoEstado, litros, litrosCargados, ubicacion } = await req.json();

        console.log("📦 PATCH recibido:", { id, nuevoEstado, litros, litrosCargados, ubicacion });

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        const orden = await Orden.findById(id);
        if (!orden) {
            return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
        }

        if (nuevoEstado === "CARGADA" && (litrosCargados || litros) && ubicacion) {
            if (orden.estado !== "AUTORIZADA") {
                return NextResponse.json({ error: "Solo se puede actualizar una orden autorizada" }, { status: 400 });
            }

            const token = await getToken({
                req: req as NextRequest,
                secret: process.env.NEXTAUTH_SECRET,
                secureCookie: process.env.NODE_ENV === "production",
            });

            if (!token) {
                return NextResponse.json({ error: "No se pudo identificar el playero" }, { status: 401 });
            }

            const playeroId = token.id;

            const { default: Ubicacion } = await import("@/models/Ubicacion");
            const ubicacionDoc = await Ubicacion.findById(ubicacion);
            if (!ubicacionDoc) {
                return NextResponse.json({ error: "Ubicación no encontrada" }, { status: 404 });
            }

            const litrosSolicitados = orden.litros ?? 0;
            const litrosReales = litrosCargados ?? litros ?? 0;

            console.log("🧪 Comparando litros solicitados vs cargados:", litrosSolicitados, litrosReales);

            orden.estado = "CARGADA";
            orden.litrosCargados = litrosReales;
            orden.importe = undefined;
            orden.tanqueLleno = false;
            orden.playeroId = playeroId;
            orden.fechaCarga = new Date();
            orden.ubicacionId = ubicacionDoc._id;

            if (litrosSolicitados > litrosReales) {
                const diferencia = litrosSolicitados - litrosReales;
                orden.litros = litrosSolicitados;

                await orden.save();

                const nuevaOrden = new Orden({
                    empresaId: orden.empresaId,
                    unidadId: orden.unidadId,
                    choferId: orden.choferId,
                    producto: orden.producto,
                    litros: diferencia,
                    monto: undefined,
                    tanqueLleno: false,
                    condicionPago: orden.condicionPago,
                    fechaEmision: new Date(),
                    estado: "PENDIENTE_AUTORIZACION",
                    codigoOrden: nanoid(6).replace(/[^A-Z0-9]/g, ""),
                });
                await nuevaOrden.save();

                const ordenActualizada = await Orden.findById(id)
                    .populate("unidadId", "matricula")
                    .populate("choferId", "nombre documento")
                    .populate("playeroId", "nombre documento")
                    .populate("ubicacionId", "nombre")
                    .lean();

                const nuevaOrdenActual = await Orden.findById(nuevaOrden._id)
                    .populate("unidadId", "matricula")
                    .populate("choferId", "nombre documento")
                    .populate("ubicacionId", "nombre")
                    .lean();

                return NextResponse.json({ ordenActualizada, nuevaOrden: nuevaOrdenActual });
            } else {
                orden.litros = litrosSolicitados;
                await orden.save();

                const ordenActualizada = await Orden.findById(id)
                    .populate("unidadId", "matricula")
                    .populate("choferId", "nombre documento")
                    .populate("playeroId", "nombre documento")
                    .populate("ubicacionId", "nombre")
                    .lean();

                return NextResponse.json(ordenActualizada);
            }
        }

        // Cambios de estado simples
        const estadosValidos = ["PENDIENTE_AUTORIZACION", "AUTORIZADA", "CARGADA"];
        if (!estadosValidos.includes(nuevoEstado)) {
            return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
        }

        const ordenActualizada = await Orden.findByIdAndUpdate(
            id,
            { estado: nuevoEstado },
            { new: true }
        )
            .populate("unidadId", "matricula")
            .populate("choferId", "nombre documento")
            .lean();

        if (!ordenActualizada) {
            return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
        }

        return NextResponse.json(ordenActualizada);
    } catch (error) {
        console.error("❌ Error actualizando orden:", error);
        return NextResponse.json({ error: "Error actualizando orden" }, { status: 500 });
    }
}
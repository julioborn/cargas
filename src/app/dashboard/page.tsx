"use client";

import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();

    return (
        <div className="max-w-xl mx-auto p-6 mt-28 bg-white rounded-md border border-black">
            <h1 className="text-3xl font-bold mb-6 text-center">Administrador</h1>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <button
                    onClick={() => router.push("/ordenes-admin")}
                    className="flex justify-center items-center gap-1 bg-green-600 text-white font-semibold px-4 py-2 rounded hover:bg-green-700"
                >
                    Órdenes
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5"
                    >
                        <path
                            fillRule="evenodd"
                            d="M15.988 3.012A2.25 2.25 0 0 1 18 5.25v6.5A2.25 2.25 0 0 1 15.75 14H13.5V7A2.5 2.5 0 0 0 11 4.5H8.128a2.252 2.252 0 0 1 1.884-1.488A2.25 2.25 0 0 1 12.25 1h1.5a2.25 2.25 0 0 1 2.238 2.012ZM11.5 3.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.25h-3v-.25Z"
                            clipRule="evenodd"
                        />
                        <path
                            fillRule="evenodd"
                            d="M2 7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7Zm2 3.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Zm0 3.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
                <button
                    onClick={() => router.push("/playeros")}
                    className="flex justify-center items-center gap-1 bg-green-600 text-white font-semibold px-4 py-2 rounded hover:bg-green-700"
                >
                    Playeros
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                        <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
                    </svg>
                </button>
                <button
                    onClick={() => router.push("/listado-admin")}
                    className="flex justify-center items-center gap-1 bg-green-600 text-white font-semibold px-4 py-2 rounded hover:bg-green-700"
                >
                    Listado
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            fillRule="evenodd"
                            d="M6 4.75A.75.75 0 016.75 4h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 4.75ZM6 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75A.75.75 0 016 10Zm0 5.25a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75ZM1.99 4.75a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1H2.99a1 1 0 01-1-1v-.01ZM1.99 15.25a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1H2.99a1 1 0 01-1-1v-.01ZM1.99 10a1 1 0 011-1H3a1 1 0 011 1v.01a1 1 0 01-1 1H2.99a1 1 0 01-1-1V10Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
                <button
                    onClick={() => router.push("/empresas-admin")}
                    className="flex justify-center items-center gap-1 bg-green-600 text-white font-semibold px-4 py-2 rounded hover:bg-green-700"
                >
                    Empresas
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                        <path d="M14.916 2.404a.75.75 0 0 1-.32 1.011l-.596.31V17a1 1 0 0 1-1 1h-2.26a.75.75 0 0 1-.75-.75v-3.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 1-.75.75h-3.5a.75.75 0 0 1 0-1.5H2V9.957a.75.75 0 0 1-.596-1.372L2 8.275V5.75a.75.75 0 0 1 1.5 0v1.745l10.404-5.41a.75.75 0 0 1 1.012.319ZM15.861 8.57a.75.75 0 0 1 .736-.025l1.999 1.04A.75.75 0 0 1 18 10.957V16.5h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1-.75-.75V9.21a.75.75 0 0 1 .361-.64Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

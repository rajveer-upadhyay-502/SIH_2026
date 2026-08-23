import { Link } from "react-router-dom";

const Unauthorized = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">

            <div className="text-center">

                <h1 className="text-5xl font-bold">
                    403
                </h1>

                <p className="mt-3 text-slate-500">
                    You don't have permission to access this page.
                </p>

                <Link
                    to="/"
                    className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white"
                >
                    Go Home
                </Link>

            </div>

        </div>
    );
};

export default Unauthorized;
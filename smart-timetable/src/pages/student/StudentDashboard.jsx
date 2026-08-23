import { logoutUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const StudentDashboard = () => {
    const { profile } = useAuth();

    return (
        <div className="min-h-screen bg-slate-100 p-8">

            <div className="flex justify-between">

                <div>
                    <h1 className="text-3xl font-bold">
                        Student Dashboard
                    </h1>

                    <p className="text-slate-500">
                        Welcome, {profile?.name}
                    </p>
                </div>

                <button
                    onClick={logoutUser}
                    className="rounded-lg bg-red-500 px-4 py-2 text-white"
                >
                    Logout
                </button>

            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">

                <div className="rounded-xl bg-white p-6 shadow">
                    Today's Classes
                </div>

                <div className="rounded-xl bg-white p-6 shadow">
                    Weekly Timetable
                </div>

                <div className="rounded-xl bg-white p-6 shadow">
                    Room & Faculty Info
                </div>

            </div>

        </div>
    );
};

export default StudentDashboard;
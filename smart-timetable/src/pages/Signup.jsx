import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { signupUser } from "../services/authService";

const Signup = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "student",
        departmentId: "",
        studentId: "",
        employeeId: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            await signupUser(form);

            navigate("/login");
        } catch (error) {
            console.error(error);

            setError(
                error.code === "auth/email-already-in-use"
                    ? "An account with this email already exists."
                    : error.message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">

            <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">

                <h1 className="text-3xl font-bold">
                    Create Account
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Register as Faculty or Student
                </p>

                {error && (
                    <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-4"
                >

                    <input
                        name="name"
                        placeholder="Full name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border px-4 py-3"
                    />

                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border px-4 py-3"
                    />

                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="w-full rounded-lg border px-4 py-3"
                    />

                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-4 py-3"
                    >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                    </select>

                    <input
                        name="departmentId"
                        placeholder="Department ID e.g. CSE"
                        value={form.departmentId}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border px-4 py-3"
                    />

                    {form.role === "student" && (
                        <input
                            name="studentId"
                            placeholder="Student ID"
                            value={form.studentId}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border px-4 py-3"
                        />
                    )}

                    {/* Faculty employeeId is no longer needed during signup as they are matched by email */}

                    <button
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>

                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?
                    <Link
                        to="/login"
                        className="ml-1 font-semibold text-blue-600"
                    >
                        Login
                    </Link>
                </p>

            </div>

        </div>
    );
};

export default Signup;
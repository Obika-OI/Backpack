import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import ExploreOrgs from "../pages/ExploreOrgs";
import Home from "../pages/Home";
import Onboarding from "../pages/Onboarding";
import CourseUpload from "../pages/CourseUpload";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import CourseDetails from "../pages/CourseDetails";
import Lunch from "../pages/Lunch";
import { OrgProfile } from "../pages/OrgProfile";
import { Navbar } from "./Navbar";
import { AppProvider } from "../../store/AppContext";
import { AuthProvider, useAuth } from "../../store/AuthContext";
import { ThemeProvider } from "../../store/ThemeContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="p-8 text-center dark:text-slate-400 text-slate-600">Loading...</div>;
  if (!currentUser) return <Navigate to="/login" />;
  return <>{children}</>;
};

const Index: React.FC = () => {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppProvider>
                    <BrowserRouter>
                        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
                            <Navbar />
                            <main className="flex-1 max-w-7xl w-full mx-auto p-6">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/signup" element={<Signup />} />
                                <Route path="/explore" element={
                                    <ProtectedRoute><ExploreOrgs /></ProtectedRoute>
                                } />
                                <Route path="/org/:orgId" element={
                                    <OrgProfile />
                                } />
                                <Route path="/dashboard" element={
                                    <ProtectedRoute><Dashboard /></ProtectedRoute>
                                } />
                                <Route path="/onboard" element={
                                    <ProtectedRoute><Onboarding /></ProtectedRoute>
                                } />
                                <Route path="/upload-course" element={
                                    <ProtectedRoute><CourseUpload /></ProtectedRoute>
                                } />
                                <Route path="/course/:courseId" element={
                                    <ProtectedRoute><CourseDetails /></ProtectedRoute>
                                } />
                                <Route path="/lunch" element={
                                    <ProtectedRoute><Lunch /></ProtectedRoute>
                                } />
                            </Routes>
                        </main>
                    </div>
                </BrowserRouter>
            </AppProvider>
        </AuthProvider>
        </ThemeProvider>
    );
};

export default Index;

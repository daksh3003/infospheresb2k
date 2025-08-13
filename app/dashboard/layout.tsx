// app/dashboard/layout.tsx
"use client";

import { useState, ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  ShieldCheck,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Cpu,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/utils/supabase"; // Import supabase

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [currentUserRole, setCurrentUserRole] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleLogout = async () => {
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Update the most recent session with logout time
        const { error: sessionError } = await supabase
          .from("user_sessions")
          .update({
            logout_time: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .is("logout_time", null);

        if (sessionError) {
          console.error("Error updating logout time:", sessionError);
        }
      }

      // Sign out from Supabase auth
      await supabase.auth.signOut();

      // Clear local storage and session storage as in your original code
      localStorage.removeItem("userRole");
      sessionStorage.clear();
      // Navigate to login page
      router.push("/auth/login");
    } catch (error) {
      console.error("Error during logout:", error);
      // If there's an error, still redirect to login page
      router.push("/auth/login");
    }
  };

  const navigation = [
    { name: "Project Manager", href: "/dashboard/pm", icon: Users },
    { name: "Processing Team", href: "/dashboard/processor", icon: Cpu },
    { name: "QC Team", href: "/dashboard/qc", icon: ClipboardCheck },
    { name: "QA Team", href: "/dashboard/qa", icon: ShieldCheck },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log(user?.user_metadata.role);
      setCurrentUserRole(user?.user_metadata.role);
      // console.log(user?.user_metadata.name );
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-0 left-0 z-40 w-full bg-white border-b border-gray-200 flex items-center justify-between px-4 h-16">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 focus:outline-none"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="ml-4 text-xl font-bold text-blue-800">
            B2K Dashboard
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 focus:outline-none">
            <Bell size={20} />
          </button>
          <Avatar>
            {/* <AvatarImage src="/avatars/user.png" /> */}
            <AvatarFallback className="bg-blue-800 text-white">
              {currentUser?.user_metadata?.name
                ? currentUser.user_metadata.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : currentUser?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-blue-700">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center mr-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">
              Bytes 2 Knowledge
            </span>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-6 overflow-y-auto">
            <nav className="space-y-1">
              {navigation
                .filter((item) => {
                  if (item.name === "Settings") return true;
                  if (currentUserRole === "projectManager") return true;
                  return (
                    pathname.startsWith(item.href) &&
                    item.href.includes(currentUserRole || "")
                  );
                })
                .map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-md group transition-colors ${
                        isActive
                          ? "bg-blue-700 text-white"
                          : "text-blue-100 hover:bg-blue-700 hover:text-white"
                      }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 ${
                          isActive
                            ? "text-white"
                            : "text-blue-300 group-hover:text-white"
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
            </nav>
          </div>

          {/* User section */}
          <div className="p-4 border-t border-blue-700">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center text-left px-4 py-2 text-sm text-blue-100 hover:bg-blue-700 hover:text-white rounded-md"
                >
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      {/* <AvatarImage src="/avatars/user.png" /> */}
                      <AvatarFallback className="bg-blue-900 text-white">
                        {currentUser?.user_metadata?.name
                          ? currentUser.user_metadata.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                          : currentUser?.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {currentUser?.user_metadata?.name || "User Name"}
                      </p>
                      <p className="text-xs text-blue-300">
                        {currentUser?.email || "user@example.com"}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 lg:ml-64`}>
        {/* Desktop header */}
        <header className="hidden lg:flex h-16 border-b border-gray-200 bg-white items-center justify-between px-6">
          <h1 className="text-2xl font-bold text-blue-800">B2K Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon">
              <Bell size={20} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar>
                    {/* <AvatarImage src="/avatars/user.png" alt="User" /> */}
                    <AvatarFallback className="bg-blue-800 text-white">
                      {currentUser?.user_metadata?.name
                        ? currentUser.user_metadata.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                        : currentUser?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 pt-20 lg:pt-6">{children}</main>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}

// app/dashboard/layout.tsx
"use client";

import { useState, ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  ShieldCheck,
  Users,
  LogOut,
  Menu,
  X,
  Cpu,
  UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { authManager, type AuthUser } from "@/utils/auth";
import { toast } from "react-toastify";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const handleLogout = async () => {
    try {
      if (authManager) {
        await authManager.signOut();
      }
      router.push("/auth/login");
      router.refresh(); // Refresh to clear server session
    } catch (error) {
      console.error("Error during logout:", error);
      // If there's an error, still redirect to login page
      router.push("/auth/login");
      router.refresh();
    }
  };

  const navigation = [
    { name: "Project Manager", href: "/dashboard/pm", icon: Users },
    { name: "Processing Team", href: "/dashboard/processor", icon: Cpu },
    { name: "QC Team", href: "/dashboard/qc", icon: ClipboardCheck },
    { name: "QA Team", href: "/dashboard/qa", icon: ShieldCheck },
    { name: "User Management", href: "/dashboard/user-management", icon: UserCog },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !authManager) return;

    // Check current auth status on mount
    authManager.checkAuthStatus();

    // Function to fetch user role from API
    const fetchUserRole = async (userId: string) => {
      try {
        const response = await fetch(`/api/auth/user/role?userId=${userId}`);

        if (!response.ok) {
          toast("Invalid login credentials", {
            type: "error",
            position: "top-right",
          });
          return null;
        }

        const data = await response.json();
        return data.role || null;
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        return null;
      }
    };

    // Listen for auth state changes
    const unsubscribe = authManager.onAuthStateChange(async (user: AuthUser | null) => {
      setCurrentUser(user);

      if (user?.id) {
        // Fetch role from API
        const role = await fetchUserRole(user.id);
        console.log("user role from API", role);
        setCurrentUserRole(role);
      } else {
        setCurrentUserRole(null);
      }

      console.log("user", user);
    });

    return unsubscribe;
  }, [router]);



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
          <Avatar>
            {/* <AvatarImage src="/avatars/user.png" /> */}
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
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-blue-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
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

                  // Check if the user role matches the dashboard
                  // Allow access based on role mapping
                  const roleMapping: { [key: string]: string[] } = {
                    projectManager: [
                      "/dashboard/pm",
                      "/dashboard/processor",
                      "/dashboard/qc",
                      "/dashboard/qa",
                      "/dashboard/user-management",
                    ],
                    processor: ["/dashboard/processor"],
                    qcTeam: ["/dashboard/qc"],
                    qaTeam: ["/dashboard/qa"],
                  };

                  const allowedPaths = roleMapping[currentUserRole || ""] || [];
                  return allowedPaths.includes(item.href);
                })
                .map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-md group transition-colors ${isActive
                        ? "bg-blue-700 text-white"
                        : "text-blue-100 hover:bg-blue-700 hover:text-white"
                        }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 ${isActive
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
                {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
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

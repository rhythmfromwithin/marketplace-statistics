import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useLang } from "@/contexts/LanguageContext";
import { BarChart2, LayoutDashboard, LogIn, LogOut, PanelLeft, Store, Tag } from "lucide-react";
import PriceChat from "./PriceChat";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const menuItems = isAuthenticated ? [
    { icon: LayoutDashboard, label: t.nav.dashboard, path: "/" },
    { icon: Tag, label: t.nav.products, path: "/products" },
    { icon: BarChart2, label: t.nav.history, path: "/history" },
    { icon: Store, label: t.nav.competitors, path: "/competitors" },
  ] : [{ icon: LayoutDashboard, label: t.nav.dashboard, path: "/" }];

  const activeMenuItem = menuItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    if (!isAuthenticated && location !== "/") {
      setLocation("/");
    }
  }, [isAuthenticated, location, setLocation]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border">
            <div className="flex items-center gap-3 px-3 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">PI</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold tracking-tight truncate text-foreground text-sm leading-tight">{t.appName}</span>
                    <span className="text-[10px] tracking-widest uppercase" style={{color: 'var(--navos-text-tertiary)'}}>by Navos</span>
                  </div>
                  {/* Language toggle */}
                  <button
                    onClick={toggleLang}
                    className="shrink-0 h-6 px-2 rounded-md border border-border text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title={lang === "en" ? "切换中文" : "Switch to English"}
                  >
                    {lang === "en" ? "中" : "EN"}
                  </button>
                </div>
              ) : (
                /* Collapsed: show lang toggle as icon */
                <button
                  onClick={toggleLang}
                  className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none text-[10px] font-bold text-muted-foreground"
                  title={lang === "en" ? "切换中文" : "Switch to English"}
                >
                  {lang === "en" ? "中" : "EN"}
                </button>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 pt-2">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-9 transition-all rounded-lg text-sm ${
                        isActive
                          ? 'bg-primary/8 text-primary font-medium'
                          : 'font-normal text-sidebar-foreground hover:bg-sidebar-accent'
                      }`}
                    >
                      <div className="relative">
                        <item.icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <span className="flex-1">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user ? user.name?.charAt(0).toUpperCase() : (lang === "zh" ? "访" : "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || t.guestLabel}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || t.demoMode}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user ? (
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{lang === "zh" ? "退出登录" : "Sign out"}</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => { window.location.href = getLoginUrl(); }}
                    className="cursor-pointer"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>{t.signIn}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground text-sm">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
            <button
              onClick={toggleLang}
              className="h-7 px-2 rounded-md border border-border text-[11px] font-semibold text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              {lang === "en" ? "中" : "EN"}
            </button>
          </div>
        )}
        <main className="flex-1 p-6 bg-background min-h-screen pb-28">{children}</main>
        {isAuthenticated && <PriceChat />}
      </SidebarInset>
    </>
  );
}

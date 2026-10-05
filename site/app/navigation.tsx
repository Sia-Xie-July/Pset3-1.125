'use client';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Globe2, Network, BookOpen, MessageSquare } from 'lucide-react';
const pages=[['/','Overview',LayoutDashboard],['/country-comparison','Country Comparison',Globe2],['/initial-design','Initial Design',Network],['/evidence','Evidence',BookOpen],['/ask-the-adviser','Ask the Adviser',MessageSquare]] as const;
export function Navigation(){const path=usePathname();return <nav aria-label="Main navigation">{pages.map(([href,label,Icon])=><a key={href} href={href} className={path===href?'active':''} aria-current={path===href?'page':undefined}><Icon size={19} aria-hidden="true"/>{label}</a>)}</nav>;}

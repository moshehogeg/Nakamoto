import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, BookOpen, Code2, TerminalSquare, Play, ChevronRight, Rocket, PlugZap,
  Cpu, Shield, GitBranch, Server, Smartphone, Database, Gauge, Copy, Check, Globe, Network
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const DEFAULT_NODE_URL = 'http://127.0.0.1:8545/api';
const getNodeUrl = () => localStorage.getItem('nak_node_url') || DEFAULT_NODE_URL;

async function jfetch(path: string, body?: any) {
  const url = `${getNodeUrl()}${path}`;
  const opts: RequestInit = body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'GET' };
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

function useClipboard(text: string, timeout = 1500) {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    async copy() {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    }
  };
}

const nav = [
  { key: 'getting-started', label: 'Getting Started', icon: <Rocket className="w-4 h-4" /> },
  { key: 'api', label: 'API Playground', icon: <PlugZap className="w-4 h-4" /> },
  { key: 'sdks', label: 'SDKs & Snippets', icon: <Code2 className="w-4 h-4" /> },
  { key: 'tutorials', label: 'Tutorials', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'vectors', label: 'Test Vectors', icon: <Database className="w-4 h-4" /> },
  { key: 'status', label: 'Network Status', icon: <Gauge className="w-4 h-4" /> },
];

export default function DevPortal() {
  const [active, setActive] = useState('getting-started');
  const [search, setSearch] = useState('');
  const [endpoint, setEndpoint] = useState('getBlockHeader');
  const [params, setParams] = useState<any>({ height: 100, address: '', hex: '' });
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

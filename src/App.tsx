import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Menu, X, Search, BookOpen, Code2, TerminalSquare, Play, ChevronRight, Rocket,
  PlugZap, Cpu, Shield, GitBranch, Server, Smartphone, Database, Gauge,
  Copy, Check, Globe, Network
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const DEFAULT_NODE_URL = (import.meta as any)?.env?.VITE_DEFAULT_NODE_URL || "http://127.0.0.1:8545/api";
const getNodeUrl = () => localStorage.getItem("nak_node_url") || DEFAULT_NODE_URL;

async function jfetch(path: string, body?: any) {
  const url = `${getNodeUrl()}${path}`;
  const opts: RequestInit = body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : { method: "GET" };
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
  { key: "getting-started", label: "Getting Started", icon: <Rocket className="w-4 h-4" /> },
  { key: "api", label: "API Playground", icon: <PlugZap className="w-4 h-4" /> },
  { key: "sdks", label: "SDKs & Snippets", icon: <Code2 className="w-4 h-4" /> },
  { key: "tutorials", label: "Tutorials", icon: <BookOpen className="w-4 h-4" /> },
  { key: "vectors", label: "Test Vectors", icon: <Database className="w-4 h-4" /> },
  { key: "status", label: "Network Status", icon: <Gauge className="w-4 h-4" /> },
  { key: "whitepaper", label: "White Paper", icon: <BookOpen className="w-4 h-4" /> },
];

export default function DevPortal() {
  const [active, setActive] = useState("getting-started");
  const [search, setSearch] = useState("");
  const [endpoint, setEndpoint] = useState("getBlockHeader");
  const [params, setParams] = useState<any>({ height: 100, address: "", hex: "" });
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [nodeUrl, setNodeUrl] = useState(getNodeUrl());
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { localStorage.setItem("nak_node_url", nodeUrl); }, [nodeUrl]);
  useEffect(() => { setResp(null); }, [endpoint]);

  function EndpointForm() {
    const schema: Record<string, { method: "GET" | "POST"; path: () => string; body?: () => any; desc: string; }> = {
      getBlockHeader:     { method: "GET",  path: () => `/getBlockHeader?height=${params.height ?? ""}`,                           desc: "Fetch a block header by height or hash." },
      getBalance:         { method: "GET",  path: () => `/getBalance?address=${encodeURIComponent(params.address || "nak1q...")}`, desc: "Get confirmed balance for an address." },
      getUTXO:            { method: "GET",  path: () => `/getUTXO?address=${encodeURIComponent(params.address || "nak1q...")}`,    desc: "List UTXOs for an address." },
      sendRawTransaction: { method: "POST", path: () => "/sendRawTransaction", body: () => ({ hex: params.hex || "<rawTxHex>" }),  desc: "Broadcast a signed transaction." },
      getNetworkInfo:     { method: "GET",  path: () => "/getNetworkInfo",                                                          desc: "General node & network information." },
      getSyncStatus:      { method: "GET",  path: () => "/getSyncStatus",                                                           desc: "Syncing progress and tips." },
    };
    const meta = schema[endpoint];
    const path = meta.path();
    const body = meta.body ? meta.body() : undefined;

    const curl = meta.method === "GET"
      ? `curl -s ${nodeUrl}${path}`
      : `curl -s -X POST ${nodeUrl}${path} -H 'Content-Type: application/json' -d '${JSON.stringify(body)}'`;
    const js = meta.method === "GET"
      ? `const res = await fetch('${nodeUrl}${path}');
const json = await res.json();`
      : `const res = await fetch('${nodeUrl}${path}', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(${JSON.stringify(body, null, 2)}) });
const json = await res.json();`;

    async function run() {
      setLoading(true);
      try { const data = await jfetch(path, body); setResp(data); }
      catch (e: any) { setResp({ error: String(e) }); }
      finally { setLoading(false); }
    }

    return (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Node URL
            <input value={nodeUrl} onChange={e => setNodeUrl(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md border bg-white/50" placeholder="http://127.0.0.1:8545/api" />
          </label>
          <label className="text-sm">Endpoint
            <select value={endpoint} onChange={e => setEndpoint(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md border bg-white/50">
              <option value="getBlockHeader">GET /getBlockHeader</option>
              <option value="getBalance">GET /getBalance</option>
              <option value="getUTXO">GET /getUTXO</option>
              <option value="sendRawTransaction">POST /sendRawTransaction</option>
              <option value="getNetworkInfo">GET /getNetworkInfo</option>
              <option value="getSyncStatus">GET /getSyncStatus</option>
            </select>
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {endpoint === "getBlockHeader" && (
            <label className="text-sm">height
              <input type="number" value={params.height ?? ""} onChange={e => setParams((p: any) => ({ ...p, height: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-white/50" placeholder="100" />
            </label>
          )}
          {(endpoint === "getBalance" || endpoint === "getUTXO") && (
            <label className="text-sm">address
              <input value={params.address || ""} onChange={e => setParams((p: any) => ({ ...p, address: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-white/50" placeholder="nak1q..." />
            </label>
          )}
          {endpoint === "sendRawTransaction" && (
            <label className="text-sm sm:col-span-3">rawTx hex
              <textarea value={params.hex || ""} onChange={e => setParams((p: any) => ({ ...p, hex: e.target.value }))} className="w-full mt-1 px-3 py-2 rounded-md border bg-white/50 h-28" placeholder="02000000..." />
            </label>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={run} className="px-4 py-3 rounded-lg bg-black text-white flex items-center gap-2 disabled:opacity-50 active:scale-[.99]" disabled={loading}>
            <Play className="w-4 h-4" />{loading ? "Running…" : "Run"}
          </button>
          <small className="text-gray-500">{meta.desc}</small>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <CodeBlock title="cURL" code={curl} />
          <CodeBlock title="JavaScript" code={js} />
        </div>

        <div>
          <h4 className="font-semibold mb-2">Response</h4>
          <div className="rounded-lg border bg-white/50 p-3 overflow-auto max-h-[60vh]">
            <pre className="text-sm whitespace-pre-wrap">{resp ? JSON.stringify(resp, null, 2) : "—"}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2">
          <button onClick={() => setDrawerOpen(true)} className="md:hidden p-2 rounded-lg border bg-white/70 active:scale-[.98]" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <Cpu className="w-5 h-5" />
          <h1 className="font-bold text-base sm:text-lg">Nakamoto Developer Portal</h1>
          <div className="ml-auto relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search docs…" className="pl-9 pr-3 py-2 rounded-lg border bg-white/60 w-[260px]" />
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 grid md:grid-cols-[260px_1fr] gap-4 sm:gap-6 py-4 sm:py-6">
        {/* Sidebar (desktop) */}
        <aside className="space-y-2 hidden md:block">
          <NavList active={active} setActive={setActive} nodeUrl={nodeUrl} />
        </aside>

        {/* Main */}
        <main className="pb-20">
          {active === "getting-started" && <GettingStarted />}
          {active === "api" && <EndpointForm />}
          {active === "sdks" && <SDKs />}
          {active === "tutorials" && <Tutorials />}
          {active === "vectors" && <Vectors />}
          {active === "status" && <StatusCard />}
          {active === "whitepaper" && <WhitePaper />}
        </main>
      </div>

      {/* Drawer (mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[82%] max-w-[320px] bg-white shadow-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><Cpu className="w-5 h-5" /><span className="font-semibold">Menu</span></div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg border bg-white active:scale-[.98]" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavList active={active} setActive={(k) => { setActive(k); setDrawerOpen(false); }} nodeUrl={nodeUrl} />
          </div>
        </div>
      )}

      <footer className="border-t py-5 text-center text-xs sm:text-sm text-gray-500">
        Built with ❤️ for the Nakamoto community — {new Date().getFullYear()}
      </footer>
    </div>
  );
}

/* --- components --- */

function NavList({ active, setActive, nodeUrl }:{ active:string; setActive:(k:string)=>void; nodeUrl:string; }) {
  const items = [
    { key: "getting-started", label: "Getting Started", icon: <Rocket className="w-4 h-4" /> },
    { key: "api", label: "API Playground", icon: <PlugZap className="w-4 h-4" /> },
    { key: "sdks", label: "SDKs & Snippets", icon: <Code2 className="w-4 h-4" /> },
    { key: "tutorials", label: "Tutorials", icon: <BookOpen className="w-4 h-4" /> },
    { key: "vectors", label: "Test Vectors", icon: <Database className="w-4 h-4" /> },
    { key: "status", label: "Network Status", icon: <Gauge className="w-4 h-4" /> },
    { key: "whitepaper", label: "White Paper", icon: <BookOpen className="w-4 h-4" /> },
  ];
  return (
    <>
      {items.map(item => (
        <button key={item.key} onClick={() => setActive(item.key)}
          className={`w-full flex items-center gap-2 px-3 py-3 rounded-xl border text-left ${active === item.key ? "bg-black text-white border-black" : "bg-white/60 hover:bg-white"}`}>
          {item.icon}<span>{item.label}</span><ChevronRight className="w-4 h-4 ml-auto opacity-60" />
        </button>
      ))}
      <div className="mt-4 p-3 rounded-xl border bg-white/60">
        <div className="text-xs font-semibold mb-2">Quick Links</div>
        <ul className="text-sm space-y-1 list-disc pl-5">
          <li>RPC: <code className="rounded bg-slate-100 px-1 break-all">{nodeUrl}</code></li>
          <li>HRP: <code>nak</code> / <code>tknak</code></li>
          <li>Addr v0: hash160(pubkey)</li>
          <li>Finality: QC ≥ 2/3 & PoV ≥ 67%</li>
        </ul>
      </div>
    </>
  );
}

function Card({ title, icon, children }:{ title:string; icon?:React.ReactNode; children:React.ReactNode; }) {
  return (
    <div className="rounded-2xl border bg-white/70 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">{icon}<h3 className="font-semibold text-lg">{title}</h3></div>
      {children}
    </div>
  );
}

function CodeBlock({ title, code }:{ title:string; code:string; }) {
  const { copied, copy } = useClipboard(code);
  return (
    <div className="relative">
      <div className="absolute right-2 top-2 flex items-center gap-2">
        <button onClick={copy} className="px-2 py-1 rounded-md border bg-white/70 text-xs flex items-center gap-1">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="rounded-xl overflow-hidden border">
        <div className="px-3 py-2 text-xs font-semibold bg-slate-100 border-b">{title}</div>
        <SyntaxHighlighter language="bash" style={oneDark} customStyle={{ margin: 0, borderRadius: 0 }}>
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function GettingStarted() {
  const curl = `# 1) Build node
cargo build --release

# 2) Start a local node
./target/release/nakd --config configs/node1.yaml

# 3) Query the node
curl -s ${getNodeUrl()}/getNetworkInfo | jq`;
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-4">
        <Card title="What is Nakamoto?" icon={<Shield className="w-4 h-4" />}>
          <p className="text-sm leading-6">
            Nakamoto is a mobile-native, zk-verified Layer 1 with DPoS + HotStuff finality and a Proof-of-Verification
            layer run by smartphones. The base layer focuses on payments & staking, with a fixed 21M supply and 2-year halvings.
          </p>
        </Card>
        <Card title="Architecture" icon={<Server className="w-4 h-4" />}>
          <ul className="text-sm space-y-1 list-disc pl-5">
            <li>Consensus: HotStuff BFT (64–128 validators)</li>
            <li>Proofs: zk-validity per block, fast verify on phones</li>
            <li>Availability: DAS by randomized mobile committees</li>
            <li>Addresses: bech32m (HRP <code>nak</code>)</li>
          </ul>
        </Card>
      </motion.div>
      <Card title="Quickstart" icon={<TerminalSquare className="w-4 h-4" />}>
        <p className="text-sm mb-3">Use these commands to compile and query a local node.</p>
        <CodeBlock title="Shell" code={curl} />
      </Card>
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Consensus" icon={<GitBranch className="w-4 h-4" />}><p className="text-sm">
          HotStuff pipeline: propose → prevote → precommit → commit. Finality when QC ≥ 2/3 and PoV ≥ 67%.
        </p></Card>
        <Card title="Mobile Verifier" icon={<Smartphone className="w-4 h-4" />}><p className="text-sm">
          Phones verify zk-proof in ~80ms and sample k=50 chunks (DAS). Attestations are rewarded.
        </p></Card>
        <Card title="Networking" icon={<Network className="w-4 h-4" />}><p className="text-sm">
          libp2p over QUIC, NAT traversal via relays, topics for blocks/tx/att/chunks.
        </p></Card>
      </div>
    </div>
  );
}

function SDKs() {
  const rust = `// Rust – derive bech32m address (v0)
use bip32::{Mnemonic, Seed, XPrv};
use sha2::{Sha256, Digest};
use ripemd::{Ripemd160};

fn hash160(pk: &[u8]) -> [u8;20] { /* ... */ }
fn bech32m(addr_hrp: &str, payload: &[u8]) -> String { /* ... */ }

fn main(){
  let m = Mnemonic::parse("abandon abandon ... about").unwrap();
  let seed = Seed::new(&m, "");
  let xprv = XPrv::derive_from_path(seed.as_bytes(), &"m/86'/0'/0'/0/0".parse().unwrap()).unwrap();
  let pk = xprv.public_key().to_bytes();
  let h160 = hash160(&pk);
  let addr = bech32m("nak", &h160);
  println!("{}", addr);
}`;
  const kotlin = `// Kotlin – mobile SDK snippet
val wallet = Wallet.create(mnemonic)
val addr = wallet.deriveAddress("m/86'/0'/0'/0/0")
val bal = rpc.getBalance(addr)
println("$addr => $bal")`;
  const swift = `// Swift – iOS SDK snippet
let wallet = Wallet(mnemonic: words)
let addr = wallet.derive("m/86'/0'/0'/0/0")
let bal = try await rpc.getBalance(addr)
print("\\(addr) => \\(bal)")`;
  const js = `// JavaScript – send raw tx
const res = await fetch('${getNodeUrl()}/sendRawTransaction', {
  method: 'POST', headers: {'Content-Type':'application/json'},
  body: JSON.stringify({ hex: '<rawTxHex>' })
});
console.log(await res.json());`;

  return (
    <div className="space-y-6">
      <Card title="Rust SDK" icon={<Code2 className="w-4 h-4" />}><SyntaxHighlighter language="rust" style={oneDark}>{rust}</SyntaxHighlighter></Card>
      <Card title="Kotlin (Android)" icon={<Smartphone className="w-4 h-4" />}><SyntaxHighlighter language="kotlin" style={oneDark}>{kotlin}</SyntaxHighlighter></Card>
      <Card title="Swift (iOS)" icon={<Smartphone className="w-4 h-4" />}><SyntaxHighlighter language="swift" style={oneDark}>{swift}</SyntaxHighlighter></Card>
      <Card title="JavaScript" icon={<Globe className="w-4 h-4" />}><SyntaxHighlighter language="javascript" style={oneDark}>{js}</SyntaxHighlighter></Card>
    </div>
  );
}

function Tutorials() {
  const t1 = `# Build & send a payment
1) Derive an address: m/86'/coin'/0'/0/0
2) Get UTXOs: GET /getUTXO?address=...
3) Build tx: select inputs, outputs, fee
4) Sign with Schnorr
5) Broadcast: POST /sendRawTransaction`;
  const t2 = `# Run a PoV attester
1) Poll /getVRFTicket
2) If selected, fetch header & proof
3) Verify zk-proof locally
4) Sample k=50 chunks from peers
5) POST /submitAttestation`;
  return (
    <div className="space-y-6">
      <Card title="Payments Tutorial" icon={<span className="inline-flex w-4 h-4 items-center justify-center rounded bg-black text-white text-[9px]">W</span>}>
        <SyntaxHighlighter language="markdown" style={oneDark}>{t1}</SyntaxHighlighter>
      </Card>
      <Card title="PoV Attester Tutorial" icon={<Shield className="w-4 h-4" />}>
        <SyntaxHighlighter language="markdown" style={oneDark}>{t2}</SyntaxHighlighter>
      </Card>
    </div>
  );
}

function Vectors() {
  const addrVec = `Mnemonic: abandon x11 about
Path: m/86'/0'/0'/0/0
PubKey: 0279be66...f81798
Hash160: 751e76e8...33bd6
Address: nak1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080`;
  const das = `n=256, m=128, k=50, h=40, c=500
P_detect_single = 1 - C(n-h,k)/C(n,k)
P_fail_all = (1-P_detect_single)^c ≈ 1.2e-55`;
  const finality = `Economically Final when:
- zk-proof verifies
- QC ≥ 2/3
- PoV ≥ 67%`;
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card title="Address Vector" icon={<Code2 className="w-4 h-4" />}><SyntaxHighlighter language="text" style={oneDark}>{addrVec}</SyntaxHighlighter></Card>
      <Card title="DAS Math" icon={<Database className="w-4 h-4" />}><SyntaxHighlighter language="text" style={oneDark}>{das}</SyntaxHighlighter></Card>
      <Card title="Finality Rule" icon={<Shield className="w-4 h-4" />}><SyntaxHighlighter language="text" style={oneDark}>{finality}</SyntaxHighlighter></Card>
    </div>
  );
}

function StatusCard() {
  const [info, setInfo] = useState<any>(null);
  const [sync, setSync] = useState<any>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => { (async () => {
    try { setInfo(await jfetch("/getNetworkInfo")); } catch (e: any) { setErr(String(e)); }
    try { setSync(await jfetch("/getSyncStatus")); } catch { /* ignore */ }
  })(); }, []);

  return (
    <div className="space-y-4">
      <Card title="Network Info" icon={<Server className="w-4 h-4" />}>
        <pre className="text-sm whitespace-pre-wrap">{info ? JSON.stringify(info, null, 2) : (err || "—")}</pre>
      </Card>
      <Card title="Sync Status" icon={<Gauge className="w-4 h-4" />}>
        <pre className="text-sm whitespace-pre-wrap">{sync ? JSON.stringify(sync, null, 2) : "—"}</pre>
      </Card>
    </div>
  );
}

function WhitePaper() {
  const pdfUrl = "/whitepaper.pdf";
  return (
    <div className="space-y-4">
      <Card title="White Paper" icon={<BookOpen className="w-4 h-4" />}>
        <p className="text-sm mb-3">
          View the white paper below or <a href={pdfUrl} download className="underline">download the PDF</a>.
        </p>
        <div className="rounded-xl border overflow-hidden bg-white">
          <iframe
            src={pdfUrl}
            title="Nakamoto White Paper"
            className="w-full"
            style={{ height: "70vh", border: 0 }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          If the inline viewer doesn’t load on your device, <a href={pdfUrl} className="underline" target="_blank" rel="noreferrer">open the PDF in a new tab</a>.
        </p>
      </Card>
    </div>
  );
}

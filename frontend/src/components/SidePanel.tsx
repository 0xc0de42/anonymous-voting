interface SidePanelProps {
  logs: string[];
  proof: unknown | null;
  witness: unknown | null;
}

export default function SidePanel({ logs, proof, witness }: SidePanelProps) {
  return (
    <div className="w-full md:w-96 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 h-fit">
      <h2 className="text-xl font-extrabold mb-4 text-gray-800">Noir Proof Debug</h2>

      <div className="mb-4">
        <div className="font-semibold mb-1 text-gray-700">Logs:</div>
        <div className="bg-black text-green-200 rounded-lg p-3 text-xs h-32 overflow-auto font-mono whitespace-pre-line border border-gray-800">
          {logs.length === 0 ? (
            <span className="text-gray-400">No logs yet.</span>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </div>

      <div className="mb-4">
        <div className="font-semibold mb-1 text-gray-700">Proof:</div>
        <div className="bg-gray-100 rounded-lg p-3 text-xs h-24 overflow-auto font-mono border border-gray-200">
          {proof ? <pre>{JSON.stringify(proof, null, 2)}</pre> : <span className="text-gray-400">No proof yet.</span>}
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1 text-gray-700">Witness:</div>
        <div className="bg-gray-100 rounded-lg p-3 text-xs h-24 overflow-auto font-mono border border-gray-200">
          {witness ? <pre>{JSON.stringify(witness, null, 2)}</pre> : <span className="text-gray-400">No witness yet.</span>}
        </div>
      </div>
    </div>
  );
}
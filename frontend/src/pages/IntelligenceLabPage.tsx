import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export default function IntelligenceLabPage() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const { data: models, isLoading: mLoading } = useQuery({
    queryKey: ['ml-models'],
    queryFn: api.getMlModels,
    refetchInterval: 30000,
  });

  const { data: evaluation, isLoading: eLoading } = useQuery({
    queryKey: ['ml-evaluation', selectedModel],
    queryFn: () => api.getMlEvaluation(selectedModel!),
    enabled: !!selectedModel,
  });

  const { data: anomalies } = useQuery({
    queryKey: ['ml-anomalies'],
    queryFn: () => api.getAnomalies(20),
    refetchInterval: 10000,
  });

  const modelIcons: Record<string, string> = {
    failure_predictor: 'warning',
    risk_scorer: 'security',
    anomaly_detector: 'radar',
    internship_ranker: 'leaderboard',
    injection_classifier: 'shield',
  };

  const modelColors: Record<string, string> = {
    failure_predictor: 'var(--predict)',
    risk_scorer: 'var(--recover)',
    anomaly_detector: 'var(--rewind)',
    internship_ranker: 'var(--prove)',
    injection_classifier: 'var(--predict)',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-[var(--tile)] border-b border-[var(--border)]">
        <h1 className="font-['Bricolage_Grotesque'] font-bold text-lg text-[var(--ink)]">INTELLIGENCE LAB</h1>
        <p className="font-mono text-[10px] uppercase mt-0.5 text-[var(--ink-2)] tracking-wider">
          ML subsystem · failure prediction · risk scoring · anomaly detection
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 content-start">
        {/* Model Cards */}
        <div className="col-span-1 lg:col-span-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {mLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="tile p-4 animate-pulse h-28" />
            ))
          ) : models?.map(model => {
            const isSel = selectedModel === model.name;
            const accent = modelColors[model.name] || 'var(--ink-2)';
            return (
              <button
                key={model.name}
                onClick={() => setSelectedModel(isSel ? null : model.name)}
                className="tile p-4 text-left transition-all relative overflow-hidden"
                style={{
                  borderColor: isSel ? accent : 'var(--border)',
                  backgroundColor: isSel ? 'var(--sand-light)' : 'var(--tile)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-xl" style={{ color: accent }}>
                    {modelIcons[model.name] || 'psychology'}
                  </span>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: model.available ? 'var(--prove)' : 'var(--predict)' }} />
                </div>
                <div className="font-mono text-[10px] font-bold uppercase text-[var(--ink)] tracking-wider">
                  {model.name.replace(/_/g, ' ')}
                </div>
                <div className="font-mono text-[10px] mt-1 text-[var(--ink-2)]">
                  v{model.version}
                </div>
                <div className="font-mono text-[9px] mt-0.5 text-[var(--ink-2)]">
                  N={model.dataset.size.toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Model Evaluation */}
        {selectedModel && (
          <div className="col-span-1 lg:col-span-2 space-y-4">
            {eLoading ? (
              <div className="tile p-8 text-center">
                <span className="font-mono text-xs text-[var(--ink-2)]">LOADING EVALUATION...</span>
              </div>
            ) : evaluation ? (
              <>
                {/* Metrics */}
                <div className="tile p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--sand)]">
                    <span className="font-mono text-[10px] uppercase text-[var(--ink)] font-bold tracking-wider">
                      MODEL METRICS — {selectedModel.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-3">
                    {Object.entries(evaluation.metrics).map(([key, val]) => (
                      <div key={key} className="bg-[var(--sand-light)] border border-[var(--border)] rounded-xl p-3">
                        <div className="font-mono text-[9px] uppercase mb-1 text-[var(--ink-2)] tracking-wider">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="font-['Bricolage_Grotesque'] font-bold text-xl text-[var(--ink)]">
                          {typeof val === 'number' ? (val < 1 ? (val * 100).toFixed(1) + '%' : val.toFixed(3)) : val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gate Status */}
                <div className="tile p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--sand)]">
                    <span className="font-mono text-[10px] uppercase text-[var(--ink)] font-bold tracking-wider">QUALITY GATES</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {evaluation.gates.map((gate, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: gate.passed ? 'var(--prove-light)' : 'var(--predict-light)',
                            border: `1px solid ${gate.passed ? 'var(--prove-border)' : 'var(--predict-border)'}`
                          }}
                        >
                          <span className="material-symbols-outlined text-xs font-bold" style={{ color: gate.passed ? 'var(--prove-text)' : 'var(--predict-text)' }}>
                            {gate.passed ? 'check' : 'close'}
                          </span>
                        </div>
                        <span className="flex-1 text-sm font-medium text-[var(--ink)]">{gate.name}</span>
                        <span className="font-mono text-xs text-[var(--ink-2)]">
                          {gate.value.toFixed(3)} / {gate.threshold.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Limitations */}
                {models?.find(m => m.name === selectedModel)?.limitations.length && (
                  <div className="tile p-0 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--sand)]">
                      <span className="font-mono text-[10px] uppercase text-[var(--ink)] font-bold tracking-wider">KNOWN LIMITATIONS</span>
                    </div>
                    <div className="p-4 space-y-2">
                      {models?.find(m => m.name === selectedModel)?.limitations.map((lim, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[var(--ink-2)]">
                          <span className="text-[var(--recover-text)] font-bold">⚠</span>
                          <span>{lim}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Anomalies */}
        <div className={selectedModel ? 'col-span-1' : 'col-span-1 lg:col-span-3'}>
          <div className="tile p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--sand)] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-[var(--ink-2)]">radar</span>
              <span className="font-mono text-[10px] uppercase text-[var(--ink)] font-bold tracking-wider">
                ANOMALY FEED ({anomalies?.length || 0})
              </span>
              <div className="ml-auto w-2 h-2 rounded-full bg-[var(--predict)] animate-pulse" />
            </div>
            <div className="divide-y divide-[var(--border)] max-h-96 overflow-auto">
              {!anomalies?.length ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined block mb-2 text-3xl text-[var(--prove)]">check_circle</span>
                  <div className="font-mono text-xs uppercase text-[var(--prove-text)] font-bold">NO ANOMALIES DETECTED</div>
                </div>
              ) : anomalies.map((anomaly: any, i: number) => (
                <div key={i} className="px-4 py-3 hover:bg-[var(--sand-light)] transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-lg bg-[var(--predict-light)] text-[var(--predict-text)] border border-[var(--predict-border)] font-bold">
                      ANOMALY
                    </span>
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      {anomaly.tool || anomaly.type || 'Unknown tool'}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[var(--ink-2)]">
                    Score: {anomaly.score?.toFixed(3) || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

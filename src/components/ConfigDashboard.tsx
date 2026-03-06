'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { rlmClient } from '@/lib/api';
import type { RLMConfig, ConfigResponse } from '@/lib/types';

export function ConfigDashboard() {
  const [config, setConfig] = useState<RLMConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rlmClient.getConfig();
      setConfig(response.config);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await rlmClient.updateConfig(config);
      setSuccess('Configuration saved successfully');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await rlmClient.reloadConfig();
      setConfig(response.config);
      setSuccess('Configuration reloaded from files');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reload config');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await rlmClient.exportConfig();
      const blob = new Blob([response.yaml], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rlm-config.yaml';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export config');
    }
  };

  const updateConfig = (path: string, value: unknown) => {
    if (!config) return;
    const keys = path.split('.');
    const newConfig = { ...config };
    let current: Record<string, unknown> = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading configuration...</div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          {error || 'Failed to load configuration'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Configuration</h2>
          <p className="text-sm text-muted-foreground">Manage RLM v4 global settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReload}>
            Reload
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            Export YAML
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}
      {success && (
        <Card className="border-green-500">
          <CardContent className="p-4 text-green-500 text-sm">{success}</CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Limits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-primary">◈</span>
              Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Max Depth</Label>
                <Input
                  type="number"
                  value={config.limits.max_depth}
                  onChange={(e) => updateConfig('limits.max_depth', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Max Iterations</Label>
                <Input
                  type="number"
                  value={config.limits.max_iterations}
                  onChange={(e) => updateConfig('limits.max_iterations', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Max Budget</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={config.limits.max_budget}
                  onChange={(e) => updateConfig('limits.max_budget', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Max Timeout (s)</Label>
                <Input
                  type="number"
                  value={config.limits.max_timeout}
                  onChange={(e) => updateConfig('limits.max_timeout', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Max Errors</Label>
                <Input
                  type="number"
                  value={config.limits.max_errors}
                  onChange={(e) => updateConfig('limits.max_errors', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-primary">◈</span>
              Verification (v4.0)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Enabled</Label>
              <Switch
                checked={config.verification.enabled}
                onCheckedChange={(v) => updateConfig('verification.enabled', v)}
              />
            </div>
            <div>
              <Label className="text-xs">Confidence Threshold</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={config.verification.threshold}
                onChange={(e) => updateConfig('verification.threshold', parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Store Failures</Label>
              <Switch
                checked={config.verification.store_failures}
                onCheckedChange={(v) => updateConfig('verification.store_failures', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Multi-Agent */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-primary">◈</span>
              Multi-Agent (v4.1)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Enabled</Label>
              <Switch
                checked={config.multi_agent.enabled}
                onCheckedChange={(v) => updateConfig('multi_agent.enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Parallel Execution</Label>
              <Switch
                checked={config.multi_agent.parallel_execution}
                onCheckedChange={(v) => updateConfig('multi_agent.parallel_execution', v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Max Agents per Task</Label>
                <Input
                  type="number"
                  value={config.multi_agent.max_agents_per_task}
                  onChange={(e) => updateConfig('multi_agent.max_agents_per_task', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Aggregation Strategy</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
                  value={config.multi_agent.aggregation_strategy}
                  onChange={(e) => updateConfig('multi_agent.aggregation_strategy', e.target.value)}
                >
                  <option value="synthesis">Synthesis</option>
                  <option value="voting">Voting</option>
                  <option value="best">Best</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Self-Improvement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-primary">◈</span>
              Self-Improvement (v4.2)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Enabled</Label>
              <Switch
                checked={config.self_improvement.enabled}
                onCheckedChange={(v) => updateConfig('self_improvement.enabled', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Store Improvements</Label>
              <Switch
                checked={config.self_improvement.store_improvements}
                onCheckedChange={(v) => updateConfig('self_improvement.store_improvements', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Graphiti Sync</Label>
              <Switch
                checked={config.self_improvement.graphiti_sync}
                onCheckedChange={(v) => updateConfig('self_improvement.graphiti_sync', v)}
              />
            </div>
            <div>
              <Label className="text-xs">Max Retry with Improvement</Label>
              <Input
                type="number"
                value={config.self_improvement.max_retry_with_improvement}
                onChange={(e) => updateConfig('self_improvement.max_retry_with_improvement', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-primary">◈</span>
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Timeout (s)</Label>
                <Input
                  type="number"
                  value={config.sessions.timeout}
                  onChange={(e) => updateConfig('sessions.timeout', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Max Sessions</Label>
                <Input
                  type="number"
                  value={config.sessions.max_sessions}
                  onChange={(e) => updateConfig('sessions.max_sessions', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Context Compaction</Label>
              <Switch
                checked={config.sessions.compaction_enabled}
                onCheckedChange={(v) => updateConfig('sessions.compaction_enabled', v)}
              />
            </div>
            <div>
              <Label className="text-xs">Compaction Threshold (tokens)</Label>
              <Input
                type="number"
                value={config.sessions.compaction_threshold}
                onChange={(e) => updateConfig('sessions.compaction_threshold', parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Model */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-primary">◈</span>
              Model
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Root Model</Label>
              <Input
                value={config.model}
                onChange={(e) => updateConfig('model', e.target.value)}
                className="mt-1"
                placeholder="e.g., gpt-4o, claude-3-opus"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

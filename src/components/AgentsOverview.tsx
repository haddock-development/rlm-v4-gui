'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { rlmClient } from '@/lib/api';
import type { AgentConfig, Skill } from '@/lib/types';
import { cn } from '@/lib/utils';

const AGENT_COLORS: Record<string, string> = {
  math: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  code: 'bg-green-500/10 text-green-500 border-green-500/20',
  search: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  reason: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

const AGENT_ICONS: Record<string, string> = {
  math: '∑',
  code: '{ }',
  search: '🔍',
  reason: '💭',
};

export function AgentsOverview() {
  const [agents, setAgents] = useState<Record<string, AgentConfig>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentSkills, setAgentSkills] = useState<Record<string, Skill[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rlmClient.getAgents();
      setAgents(response.agents);

      // Load skills for each agent
      const skillsMap: Record<string, Skill[]> = {};
      for (const agentName of Object.keys(response.agents)) {
        try {
          const skillsResponse = await rlmClient.getAgentSkills(agentName);
          skillsMap[agentName] = skillsResponse.skills;
        } catch {
          skillsMap[agentName] = [];
        }
      }
      setAgentSkills(skillsMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading agents...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  const agentList = Object.entries(agents);
  const currentAgent = selectedAgent ? agents[selectedAgent] : null;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Agent List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-primary">◈</span>
              Specialized Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {agentList.map(([name, agent]) => (
                  <Card
                    key={name}
                    className={cn(
                      'cursor-pointer transition-all',
                      selectedAgent === name
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50 hover:bg-primary/5'
                    )}
                    onClick={() => setSelectedAgent(name)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-lg font-mono',
                          AGENT_COLORS[name] || 'bg-gray-500/10 text-gray-500'
                        )}>
                          {AGENT_ICONS[name] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium capitalize">{agent.name || name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {agent.focus}
                          </div>
                        </div>
                        {agent.skills && agent.skills.length > 0 && (
                          <Badge variant="outline" className="text-[9px]">
                            {agent.skills.length} skills
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Agent Details */}
      <div className="lg:col-span-2">
        {currentAgent ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-lg font-mono',
                    AGENT_COLORS[selectedAgent!] || 'bg-gray-500/10 text-gray-500'
                  )}>
                    {AGENT_ICONS[selectedAgent!] || '?'}
                  </span>
                  <span className="capitalize">{currentAgent.name || selectedAgent}</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  Priority: {currentAgent.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Focus */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Focus Area</div>
                <div className="text-sm">{currentAgent.focus}</div>
              </div>

              {/* Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Max Iterations</div>
                  <div className="text-sm font-mono">{currentAgent.max_iterations || 'Default'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Max Depth</div>
                  <div className="text-sm font-mono">{currentAgent.max_depth || 'Default'}</div>
                </div>
              </div>

              {/* Tools */}
              {currentAgent.tools && currentAgent.tools.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Available Tools</div>
                  <div className="flex flex-wrap gap-1">
                    {currentAgent.tools.map((tool) => (
                      <Badge key={tool} variant="secondary" className="text-[10px]">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              <div>
                <div className="text-xs text-muted-foreground mb-2">Assigned Skills</div>
                {agentSkills[selectedAgent!] && agentSkills[selectedAgent!].length > 0 ? (
                  <div className="space-y-2">
                    {agentSkills[selectedAgent!].map((skill) => (
                      <Card key={skill.id} className="bg-muted/30">
                        <CardContent className="p-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-medium">{skill.id}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {skill.description}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[9px]">
                              {skill.category}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">No skills assigned</div>
                )}
              </div>

              {/* System Prompt */}
              {currentAgent.system_prompt && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">System Prompt</div>
                  <Card className="bg-muted/30">
                    <CardContent className="p-3">
                      <pre className="text-xs whitespace-pre-wrap font-mono overflow-x-auto">
                        {currentAgent.system_prompt.slice(0, 500)}
                        {currentAgent.system_prompt.length > 500 && '...'}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Source File */}
              {currentAgent.source_file && (
                <div className="text-[10px] text-muted-foreground font-mono">
                  Source: {currentAgent.source_file}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Select an agent to view details
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

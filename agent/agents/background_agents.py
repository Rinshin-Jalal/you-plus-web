"""
Background Agents for Multi-Agent Coordination
===============================================

DEPRECATED: This module is now a re-export layer for backward compatibility.
Import directly from the new modules instead:

- agents.detectors for ExcuseDetectorNode, SentimentAnalyzerNode,
  PromiseDetectorNode, QuoteExtractorNode
- agents.analyzers for CommitmentExtractorNode, PatternAnalyzerNode,
  ExcuseCalloutNode
- agents.aggregator for CallSummaryAggregator

Uses GPT-OSS-120B via Groq for fast, cheap LLM inference.
"""

# Re-export everything for backward compatibility
from agents.detectors import (
    ExcuseDetectorNode,
    SentimentAnalyzerNode,
    PromiseDetectorNode,
    QuoteExtractorNode,
)

from agents.analyzers import (
    CommitmentExtractorNode,
    ExcuseCalloutNode,
    PatternAnalyzerNode,
)

from agents.aggregator import CallSummaryAggregator

__all__ = [
    # Detector nodes (LLM-powered)
    "ExcuseDetectorNode",
    "SentimentAnalyzerNode",
    "PromiseDetectorNode",
    "QuoteExtractorNode",
    # Analyzer nodes
    "CommitmentExtractorNode",
    "ExcuseCalloutNode",
    "PatternAnalyzerNode",
    # Aggregator
    "CallSummaryAggregator",
]

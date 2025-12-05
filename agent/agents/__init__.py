"""
Agent modules for the YOU+ Future Self Agent.
==============================================

This package contains all the background agents that run in parallel
with the main speaking node, analyzing user input and emitting insights.

Modules:
- detectors: LLM-powered detection nodes (excuses, sentiment, promises, quotes)
- analyzers: Analysis nodes (commitments, patterns, excuse callouts)
- aggregator: Call summary aggregation
- events: Custom event types for agent communication
"""

from agents.events import (
    CallSummary,
    ExcuseDetected,
    ExcuseCallout,
    SentimentAnalysis,
    CommitmentIdentified,
    PromiseResponse,
    UserFrustrated,
    PatternAlert,
    MemorableQuoteDetected,
)

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
    # Events
    "CallSummary",
    "ExcuseDetected",
    "ExcuseCallout",
    "SentimentAnalysis",
    "CommitmentIdentified",
    "PromiseResponse",
    "UserFrustrated",
    "PatternAlert",
    "MemorableQuoteDetected",
    # Detector nodes
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

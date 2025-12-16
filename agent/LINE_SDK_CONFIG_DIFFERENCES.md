# LINE SDK Configuration Differences - COMPLETE ANALYSIS

**Comprehensive comparison of ALL 11 Cartesia LINE SDK examples vs our YOU+ implementation.**

**Date:** 2025-12-16  
**Source:** https://github.com/cartesia-ai/line/tree/main/examples

---

## EXAMPLES ANALYZED

✅ **ALL 11 Examples checked:**
1. `basic_chat` - Simple Gemini chat
2. `basic_chat_configurable` - Chat with configurable agent params
3. `counter` - Simple counter demo (minimal)
4. `dtmf_storyteller` - Interactive story with DTMF buttons
5. `echo` - Echo bot (minimal)
6. `form-filling` - Form questionnaire with structured data
7. `outbound_call_info` - Pre-call config with voice/language selection
8. `outbound_smb_offices` - Outbound calls with DTMF, callbacks
9. `personal_banking_handoffs` - Multi-agent handoff system
10. `sales_with_leads` - Background agent for lead extraction
11. `text_to_agent` - No config files (WebSocket only)

---

## 1. CARTESIA.TOML CONFIGURATIONS

### Pattern 1: Minimal (empty or app name only)
**Examples:** `basic_chat`, `basic_chat_configurable`, `dtmf_storyteller`, `outbound_call_info`, `personal_banking_handoffs`

```toml
# Empty file or just:
[app]
name = "app-name"
```

### Pattern 2: With build/run commands (pip install)
**Examples:** `counter`, `echo`

```toml
[build]
cmd = "pip3 install -r requirements.txt"

[run]
cmd = "python3 main.py"
```

### Pattern 3: With placeholder build/run
**Examples:** `outbound_smb_offices`, `form-filling`

```toml
[app]
name = "outbound_smb_offices"

[build]
cmd = "echo 'No build cmd specified'"

[run]
cmd = "echo 'No run cmd specified'"
```

### Pattern 4: Full configuration
**Example:** `sales_with_leads` (MOST COMPREHENSIVE!)

```toml
[cartesia]
name = "Cartesia sales"
description = "Sales agent that uses RAG to answer questions and runs a background agent to extract leads"
version = "1.0.0"

[cartesia.server]
port = 8000
host = "0.0.0.0"

[cartesia.dependencies]
requirements_file = "requirements.txt"

[cartesia.environment]
required_vars = ["GEMINI_API_KEY"]
```

### OUR IMPLEMENTATION
```toml
[app]
name = "future-self"
```

**🔥 CRITICAL FINDING:**
- **Missing sections:** We don't have `[build]`, `[run]`, `[cartesia.server]`, `[cartesia.dependencies]`, `[cartesia.environment]`
- **Best practice:** Use Pattern 4 (`sales_with_leads`) for production apps

---

## 2. PRE-CALL HANDLER CONFIGURATIONS

### Examples that DON'T use pre_call_handler
`basic_chat`, `basic_chat_configurable`, `counter`, `dtmf_storyteller`, `echo`, `form-filling`, `personal_banking_handoffs`, `sales_with_leads`

```python
app = VoiceAgentApp(handle_new_call)  # No pre_call_handler
```

### Examples that USE pre_call_handler

#### `outbound_call_info` - Voice selection based on caller
```python
async def handle_call_request(call_request: CallRequest):
    phone_number = call_request.to
    
    # Reject certain numbers
    if phone_number == "911":
        return None
    
    # VIP caller - special voice
    if phone_number == "+15555555555":
        return PreCallResult(
            metadata={"extra_prompt": "This is a VIP caller, so treat them with extra care."},
            config={
                "tts": {
                    "voice": "146485fd-8736-41c7-88a8-7cdd0da34d84",
                    "language": "en",
                }
            },
        )
    
    # Normal caller - different voice
    return PreCallResult(
        metadata={"extra_prompt": "This is a normal caller, so treat them with normal care."},
        config={
            "tts": {
                "voice": "4322a30e-e1fb-4b06-bc79-06b04f079b07",
                "language": "es",
            }
        },
    )

app = VoiceAgentApp(call_handler=handle_new_call, pre_call_handler=handle_call_request)
```

**KEY FEATURES:**
- Return `None` to reject calls
- Pass metadata to call handler via `call_request.metadata`
- Configure TTS voice ID + language per caller
- Different prompts based on caller

#### `outbound_smb_offices` - TTS model selection
```python
async def pre_call_handler(_call_request: CallRequest) -> PreCallResult:
    """Configure voice settings before starting the call."""
    tts_config = {"tts": {"model": "sonic-3"}}
    
    return PreCallResult(
        metadata={},
        config=tts_config,
    )

app = VoiceAgentApp(handle_new_call, pre_call_handler)
```

**KEY FEATURES:**
- Sets TTS model explicitly
- Minimal config

### OUR IMPLEMENTATION
```python
# core/handlers/pre_call.py
async def handle_call_request(call_request: CallRequest) -> PreCallResult:
    # Complex user lookup, call type selection, mood selection
    # ...
    return PreCallResult(
        metadata={
            "user_id": user_id,
            "call_type": call_type.name,
            "mood": mood.name,
            # ... many more fields
        },
        config={},  # ← NO TTS CONFIG!
    )
```

**🔥 CRITICAL FINDING:**
- ✅ We have pre_call_handler
- ❌ We're NOT setting `config={"tts": {...}}` - using defaults
- ❌ We don't have call rejection logic (return None)

---

## 3. CHATN NODE / REASONING NODE IMPLEMENTATIONS

### Common Pattern Across ALL Examples

**Temperature variations:**
- `basic_chat`: `0.7` (default)
- `dtmf_storyteller`: `1.3` (VERY creative for stories)
- `sales_with_leads` (LeadsExtractionNode): `0.1` (very deterministic for data extraction)
- `outbound_smb_offices`: `0.2` (in generation_config)

**Max output tokens:**
- `basic_chat`: `1000`
- `outbound_smb_offices`: `1000`
- `sales_with_leads`: `1000`
- **OUR IMPLEMENTATION:** `150` ← Much lower!

**Generation Config (Gemini):**
```python
self.generation_config = gemini_types.GenerateContentConfig(
    system_instruction=self.system_prompt,
    temperature=self.temperature,
    tools=[],  # or [EndCallTool.to_gemini_tool()]
    max_output_tokens=max_output_tokens,
    thinking_config=gemini_types.ThinkingConfig(thinking_budget=0),  # ← ALWAYS 0
)
```

**🔥 KEY FINDINGS:**
1. **ALWAYS use `tools=[]` or `tools=[EndCallTool]`** - Never omit
2. **ALWAYS use `thinking_config=ThinkingConfig(thinking_budget=0)`** - Disables Gemini thinking
3. **Temperature ranges:** 0.1 (data extraction) to 1.3 (creative storytelling)

### Warmup Method

**Only in:** `outbound_smb_offices`

```python
async def warmup(self) -> AsyncGenerator[Union[AgentResponse, EndCall], None]:
    """Warmup the Gemini client"""
    async for item in await self.client.aio.models.generate_content_stream(
        model=self.model_id,
        contents="ok",
        config=self.generation_config,
    ):
        yield item
```

Used in main.py:
```python
async for item in conversation_node.warmup():
    logger.info(f"Received item from gemini client: {item}")
```

**OUR IMPLEMENTATION:**
- ❌ No warmup method
- ❌ Could cause first-response latency

---

## 4. SYSTEM PROMPT PATTERNS

### Simple prompts (1-2 paragraphs)
**Examples:** `basic_chat`, `echo`, `counter`

```python
SYSTEM_PROMPT = """
### You and your role
You are Basic Chat, a warm, personable, intelligent and helpful AI chat bot.

Limit your responses to 1-2 sentences, less than 35 words.

### Your tone
- Always polite and respectful
- Concise and brief but never curt
- Only ask one question at a time
"""
```

### Medium complexity (system prompt + guidelines)
**Examples:** `dtmf_storyteller`, `outbound_smb_offices`, `form-filling`

```python
SYSTEM_PROMPT = """
# You and your role
You are a DND game master talking to a player over the phone.

# DND story
Fabricate a creative adventure for the user to participate in.

# Guidelines
1. You will take turns telling a story. Each turn is limited to 1-2 sentences, no more than 15 words.
2. At the end, you will tell the user to "press <dtmf_button> to make a choice"
3. The user will make a choice or they can ask you a question.
"""
```

### Complex multi-agent prompts
**Example:** `personal_banking_handoffs`

- Uses handoff tools to switch between sub-agents
- Each sub-agent has its own system prompt
- Main ChatNode orchestrates between: WelcomeAgent, VerificationAgent, TransactionAgent, FAQAgent

### Dynamic prompt building
**Example:** `sales_with_leads`

```python
# Main chat node
system_prompt = SYSTEM_PROMPT

# Background leads extraction node
leads_node = LeadsExtractionNode(
    gemini_client=leads_client,
    # Uses LEADS_EXTRACTION_PROMPT from config
)

# Background research node
research_node = ResearchNode(
    # Uses RESEARCH_PROMPT from config
)
```

### OUR IMPLEMENTATION
- **1800+ line config.py** with 4 prompt builder versions (v2, v3, v4)
- Dynamic sections: identity, pillars, persona, language mode, dark fuel, etc.
- Much more complex than any example

**FINDING:** Our prompts are 10-20x larger than examples. This is intentional for our use case, but worth noting for token usage.

---

## 5. MULTI-AGENT PATTERNS

### Pattern 1: Single Agent (Most examples)
```python
conversation_node = ChatNode(system_prompt=SYSTEM_PROMPT)
conversation_bridge = Bridge(conversation_node)
system.with_speaking_node(conversation_node, bridge=conversation_bridge)
```

### Pattern 2: Background Agents (Non-speaking)
**Example:** `sales_with_leads`

```python
# Main speaking agent
chat_node = ChatNode(system_prompt=SYSTEM_PROMPT)
conversation_bridge = Bridge(chat_node)
system.with_speaking_node(chat_node, conversation_bridge)

# Background agent 1: Lead extraction
leads_node = LeadsExtractionNode(gemini_client=leads_client)
leads_bridge = Bridge(leads_node)
leads_bridge.on(UserTranscriptionReceived).map(leads_node.add_event)
leads_bridge.on(UserStoppedSpeaking).stream(leads_node.generate).broadcast()

# Pass leads analysis back to chat node
conversation_bridge.on(LeadsAnalysis).map(chat_node.add_event)

# Background agent 2: Research
research_node = ResearchNode(gemini_client=research_client)
research_bridge = Bridge(research_node)
research_bridge.on(LeadsAnalysis).map(research_node.add_event).stream(research_node.generate).broadcast()
conversation_bridge.on(ResearchAnalysis).map(chat_node.add_event)

# Register both nodes
system.with_node(leads_node, leads_bridge)
system.with_node(research_node, research_bridge)
```

**Flow:**
1. User speaks → UserStoppedSpeaking
2. Triggers **both** chat_node AND leads_node
3. LeadsNode extracts lead info → LeadsAnalysis event
4. LeadsAnalysis triggers ResearchNode → ResearchAnalysis event
5. Both LeadsAnalysis and ResearchAnalysis sent to ChatNode
6. ChatNode has full context for response

### Pattern 3: Handoff Agents (Multiple speaking agents)
**Example:** `personal_banking_handoffs`

```python
class ChatNode(ReasoningNode):
    def __init__(self):
        # Initialize all sub-agents
        self.agents = {
            AgentState.WELCOME: WelcomeAgent(context),
            AgentState.VERIFICATION: VerificationAgent(context),
            AgentState.TRANSACTION: TransactionAgent(context),
            AgentState.FAQ: FAQAgent(context),
        }
        self.current_state = AgentState.WELCOME
    
    async def process_context(self, context):
        # Get current active agent
        agent = self.agents[self.current_state]
        
        # Process with active agent
        async for event in agent.process(context):
            if isinstance(event, ToolCall) and event.tool_name.startswith("handoff_"):
                # Switch agent
                self.current_state = self._process_handoff(event)
            else:
                yield event
```

**Each sub-agent:**
- Has its own system prompt
- Has its own tools (including handoff tools)
- Can transfer control via `handoff_to_X()` tools

### OUR IMPLEMENTATION
- Multiple background agents (ExcuseDetector, SentimentAnalyzer, etc.)
- Aggregators collect insights from background agents
- Single speaking agent (FutureYouNode) receives aggregated insights

**Pattern similarity:** Most similar to `sales_with_leads` background agent pattern

---

## 6. EVENT ROUTING PATTERNS

### Simple routing (Most examples)
```python
conversation_bridge.on(UserTranscriptionReceived).map(conversation_node.add_event)

(
    conversation_bridge.on(UserStoppedSpeaking)
    .interrupt_on(UserStartedSpeaking, handler=conversation_node.on_interrupt_generate)
    .stream(conversation_node.generate)
    .broadcast()
)
```

### Background agent routing
**Example:** `sales_with_leads`

```python
# Speaking node
conversation_bridge.on(UserTranscriptionReceived).map(chat_node.add_event)
conversation_bridge.on(UserStoppedSpeaking).interrupt_on(UserStartedSpeaking, handler=chat_node.on_interrupt_generate).stream(chat_node.generate).broadcast()

# Background nodes
leads_bridge.on(UserTranscriptionReceived).map(leads_node.add_event)
leads_bridge.on(UserStoppedSpeaking).stream(leads_node.generate).broadcast()  # No interrupt needed

# Cross-node communication
conversation_bridge.on(LeadsAnalysis).map(chat_node.add_event)
conversation_bridge.on(ResearchAnalysis).map(chat_node.add_event)
```

### OUR IMPLEMENTATION
- Similar to `sales_with_leads`
- Background agents produce custom events
- Aggregators collect and forward to main agent

---

## 7. INITIAL MESSAGE PATTERNS

### Pattern 1: No initial message (wait for user)
**Examples:** `outbound_smb_offices`, `counter`

```python
await system.start()
# No send_initial_message - user speaks first
await system.wait_for_shutdown()
```

### Pattern 2: Static initial message
**Examples:** `basic_chat`, `echo`, `sales_with_leads`

```python
await system.start()
await system.send_initial_message("Hello! I am your voice agent powered by Cartesia.")
await system.wait_for_shutdown()
```

### Pattern 3: Dynamic initial message
**Examples:** `form-filling`, `personal_banking_handoffs`

```python
await system.start()

# form-filling: Build message from form data
first_question = form_node.form_manager.get_current_question()
if first_question:
    question_text = form_node.form_manager.format_question_for_llm(first_question)
    initial_message = f"Hello! I'll be conducting a brief questionnaire with you today. Let's get started. {question_text}"
else:
    initial_message = "Hello! I'll be conducting a brief questionnaire with you today. Let's get started."

await system.send_initial_message(initial_message)

# personal_banking_handoffs: Get from agent
await system.send_initial_message(chat_node.initial_message())
```

### OUR IMPLEMENTATION
```python
# We build first message dynamically
first_message = build_first_message(user_context, mood, call_type)
await system.send_initial_message(first_message)
```

---

## 8. TOOLS AND FUNCTION CALLING

### EndCall tool (Most examples)
```python
# In generation_config
tools=[EndCallTool.to_gemini_tool()]

# Or custom definition
END_CALL_TOOL = gemini_types.Tool(
    function_declarations=[
        gemini_types.FunctionDeclaration(
            name="end_call",
            description="Only use this tool if you have the other party's agreement to end the call.",
            parameters={
                "type": "object",
                "properties": {
                    "goodbye_message": {
                        "type": "string",
                        "description": "Say that is all you need and thank them for their time.",
                    }
                },
                "required": ["goodbye_message"],
            },
        )
    ]
)
```

### Handoff tools
**Example:** `personal_banking_handoffs`

```python
# Each agent defines handoff tools
handoff_to_verification_tool = gemini_types.Tool(
    function_declarations=[
        gemini_types.FunctionDeclaration(
            name="handoff_to_verification",
            description="Transfer to verification agent to verify customer identity",
            parameters={"type": "object", "properties": {}},
        )
    ]
)
```

### Custom extraction (Pydantic schemas)
**Example:** `sales_with_leads`

```python
class LeadsInfo(BaseModel):
    name: str = Field(description="Contact's full name")
    company: str = Field(description="Company or organization name")
    email: str = Field(default="", description="Email address if mentioned")
    phone: str = Field(default="", description="Phone number if mentioned")
    interest_level: str = Field(description="Level of interest: high, medium, low")
    pain_points: list[str] = Field(default_factory=list)
    budget_mentioned: bool = Field(default=False)
    next_steps: str = Field(default="")
    notes: str = Field(description="Additional relevant notes")
```

**Extract from LLM JSON response, not function calling**

### OUR IMPLEMENTATION
- We use custom pattern matching for tool calls (not Gemini tools)
- Memory tools via pattern: `[SEARCH_MEMORY: query]`, `[ADD_MEMORY: content | type]`
- No EndCall tool usage

---

## 9. CONFIGURATION SUMMARY TABLE

| Config Item | Examples Pattern | Our Implementation | Should Adopt? |
|-------------|------------------|-------------------|---------------|
| **cartesia.toml** | Varies (see Pattern 1-4) | Minimal (Pattern 1) | ✅ YES - Use Pattern 4 |
| **[build] section** | Some have it | ❌ Missing | ✅ YES |
| **[run] section** | Some have it | ❌ Missing | ✅ YES |
| **[cartesia.server]** | `sales_with_leads` only | ❌ Missing | 🟡 MAYBE |
| **[cartesia.environment]** | `sales_with_leads` only | ❌ Missing | ✅ YES |
| **TTS config in pre_call** | Explicitly set in examples | ❌ Not set | ✅ YES |
| **TTS voice ID** | `outbound_call_info` | ❌ Not set | 🟡 MAYBE |
| **TTS language** | `outbound_call_info` | ❌ Not set | 🟡 MAYBE |
| **Call rejection (return None)** | `outbound_call_info` | ❌ Not implemented | 🟡 MAYBE |
| **Warmup method** | `outbound_smb_offices` only | ❌ Missing | ✅ YES |
| **tools=[]** | ✅ ALL Gemini examples | N/A (using Groq) | N/A |
| **thinking_budget=0** | ✅ ALL Gemini examples | N/A (using Groq) | N/A |
| **Temperature** | 0.1 to 1.3 (varies by task) | 0.7 | 🟡 TEST |
| **Max output tokens** | 1000 | 150 | ✅ RECONSIDER |
| **DTMF buffer** | `outbound_smb_offices` | ❌ Not used | 🟡 IF NEEDED |
| **Initial message** | Static or dynamic | Dynamic | ✅ GOOD |
| **Background agents** | `sales_with_leads` | ✅ Similar pattern | ✅ GOOD |
| **Event routing** | Simple `.map()` chains | Aggregators | 🟡 DIFFERENT |

---

## 10. CRITICAL CONFIG CHANGES NEEDED

### 🔥 HIGH PRIORITY (Must fix)

#### 1. Add comprehensive cartesia.toml
```toml
[app]
name = "future-self"

[build]
cmd = "uv sync"

[run]
cmd = "python main.py"

[cartesia.server]
port = 8000
host = "0.0.0.0"

[cartesia.dependencies]
requirements_file = "pyproject.toml"

[cartesia.environment]
required_vars = ["BEDROCK_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"]
```

#### 2. Add TTS config to pre_call handler
```python
# core/handlers/pre_call.py
async def handle_call_request(call_request: CallRequest) -> PreCallResult:
    # ... existing user lookup code ...
    
    return PreCallResult(
        metadata={...},
        config={
            "tts": {
                "model": "sonic-3",  # ← ADD THIS
                # Optional: "voice": "voice-id-here"
                # Optional: "language": "en"
            }
        },
    )
```

#### 3. Add warmup() method to FutureYouNode
```python
# core/chat_node.py
async def warmup(self):
    """Pre-warm the LLM connection to reduce first-response latency"""
    try:
        async for chunk in stream_response(
            messages=[{"role": "user", "content": "ok"}],
            temperature=0.0,
            max_tokens=10,
        ):
            logger.info(f"Warmup: {chunk}")
    except Exception as e:
        logger.warning(f"Warmup failed: {e}")
```

And use it in call handler:
```python
# core/handlers/call.py
async for item in future_you_node.warmup():
    logger.info(f"Warmup complete: {item}")
```

#### 4. Reconsider max_output_tokens
- Examples use: **1000 tokens**
- We use: **150 tokens**
- **Action:** Test with higher limits (300-500) for less truncation

---

### 🟡 MEDIUM PRIORITY (Consider)

#### 5. Add call rejection logic
```python
# core/handlers/pre_call.py
async def handle_call_request(call_request: CallRequest) -> PreCallResult:
    # Reject test numbers or invalid users
    if call_request.to in ["911", "+15555555555"]:
        return None  # ← Rejects call
    
    # ... rest of logic
```

#### 6. Temperature tuning
- Test different temperatures for different call types:
  - `audit`: 0.3 (more direct)
  - `reflection`: 0.7 (more empathetic)
  - `story`: 1.0 (more creative)

#### 7. Custom voice selection
```python
# Based on user preferences or call type
config = {
    "tts": {
        "model": "sonic-3",
        "voice": get_voice_for_user(user_id),  # Custom voice per user
        "language": "en",
    }
}
```

---

### 🟢 LOW PRIORITY (Optional)

#### 8. DTMF buffer (if needed for DTMF interaction)
- Import from LINE SDK: `from line.utils.dtmf_lookahead_buffer import DTMFLookAheadStringBuffer`
- Use in process_context if we need DTMF button detection

#### 9. Simplified event routing
- Consider using `.map()` directly instead of aggregators if complexity isn't needed

---

## 11. EXAMPLE-SPECIFIC LEARNINGS

### From `outbound_call_info`
- **Pre-call personalization**: Different voices/languages per caller
- **Call rejection**: Return `None` to reject
- **Metadata passing**: Use `call_request.metadata` to pass data

### From `sales_with_leads`
- **Background agents**: Run analysis in parallel without interrupting conversation
- **Custom events**: Define Pydantic models for structured data
- **Multi-node coordination**: Agents can trigger each other via events

### From `personal_banking_handoffs`
- **Sub-agent pattern**: Multiple specialized agents with handoff tools
- **State machine**: Track which agent is active
- **Shared context**: Pass BankContext between all agents

### From `form-filling`
- **Structured data collection**: Use YAML to define form questions
- **Progressive disclosure**: Build initial message from current question
- **Validation**: Track form completion state

### From `dtmf_storyteller`
- **High temperature (1.3)**: For creative content generation
- **DTMF interaction**: Handle button sequences from user
- **Turn-based flow**: Limit responses to 15 words for back-and-forth

---

## 12. FINAL RECOMMENDATIONS

### MUST DO NOW (Critical config fixes):
1. ✅ Add `[build]`, `[run]`, `[cartesia.environment]` to cartesia.toml
2. ✅ Add TTS config: `{"tts": {"model": "sonic-3"}}` in pre_call handler
3. ✅ Implement `warmup()` method and call it before starting
4. ✅ Consider raising max_output_tokens from 150 to 300-500

### SHOULD TEST (High value, low risk):
5. 🟡 Test temperature variations by call type (0.3 for audit, 0.7 for reflection)
6. 🟡 Add call rejection logic for test/invalid numbers
7. 🟡 Test with explicit voice ID selection

### OPTIONAL (If needed):
8. 🟢 DTMF buffer implementation (only if we need DTMF)
9. 🟢 Custom voice per user
10. 🟢 Simplify event routing (if aggregators cause issues)

---

## 13. WHAT'S INTENTIONALLY DIFFERENT (Not bugs!)

These are **architectural differences**, not config issues:

| Aspect | Examples | Us | Reason |
|--------|----------|-----|--------|
| **LLM** | Gemini | Groq | Different provider choice |
| **Prompt size** | 50-200 lines | 1800 lines | Complex persona/stage system |
| **Agent count** | 1-3 | 7+ | Multi-agent analytics architecture |
| **Event system** | Simple `.map()` | Aggregators | Need to collect insights from multiple agents |
| **Tools** | Gemini function calling | Pattern matching | Groq doesn't have same tool calling |
| **Temperature** | Task-specific | Single value | We use stages/personas instead |

---

## CONCLUSION

**Config changes needed (non-usage based):**

✅ **CRITICAL (Do immediately):**
1. Add cartesia.toml sections (`[build]`, `[run]`, `[cartesia.environment]`)
2. Set TTS config in pre_call handler
3. Add warmup() method
4. Reconsider max_output_tokens

🟡 **RECOMMENDED (Test and evaluate):**
5. Temperature variations by call type
6. Call rejection logic
7. Voice ID selection

🟢 **OPTIONAL (As needed):**
8. DTMF buffer
9. Event routing simplification

**Not issues (intentional differences):**
- Multi-agent architecture
- Groq vs Gemini
- Complex prompts
- Custom tool calling patterns

---

**Files to update:**
1. `cartesia.toml` - Add all missing sections
2. `core/handlers/pre_call.py` - Add TTS config
3. `core/chat_node.py` - Add warmup() method
4. `core/handlers/call.py` - Call warmup()
5. Test: Experiment with max_tokens and temperature

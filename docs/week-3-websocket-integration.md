# Week 3: WebSocket and Real-time Integration Roadmap

## Day 1: Spring Boot WebSocket Configuration
### Backend WebSocket Dependencies and Configuration
- [ ] Add WebSocket dependencies to `pom.xml`
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

- [ ] Create WebSocket Configuration Class
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple memory-based message broker
        config.enableSimpleBroker("/topic");
        // Prefix for messages from clients to server
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
               .setAllowedOriginPatterns("*")
               .withSockJS();
    }
}
```

### Breach Streaming Service
```java
@Service
@Slf4j
public class BreachStreamingService {
    private final SimpMessagingTemplate messagingTemplate;
    private final BreachRepository breachRepository;

    @Scheduled(fixedRate = 5000) // Every 5 seconds
    public void sendLatestBreaches() {
        List<Breach> recentBreaches = breachRepository.findRecentBreaches();
        messagingTemplate.convertAndSend("/topic/breaches", recentBreaches);
    }

    public void broadcastNewBreach(Breach breach) {
        messagingTemplate.convertAndSend("/topic/new-breach", breach);
    }
}
```

## Day 2: WebSocket Endpoint Development
### Breach Controller with WebSocket Support
```java
@Controller
public class BreachWebSocketController {
    @Autowired
    private BreachService breachService;

    @MessageMapping("/breaches/add")
    @SendTo("/topic/new-breach")
    public Breach addBreach(Breach breach) {
        return breachService.saveBreach(breach);
    }

    @MessageMapping("/breaches/filter")
    @SendTo("/topic/filtered-breaches")
    public List<Breach> filterBreaches(BreachFilter filter) {
        return breachService.filterBreaches(filter);
    }
}
```

## Day 3-4: React WebSocket Client Implementation
### WebSocket Service
```typescript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
    private client: Client;

    constructor() {
        this.client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            onConnect: () => {
                console.log('WebSocket Connected');
                this.subscribeToBreaches();
                this.subscribeToNewBreaches();
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            }
        });
    }

    connect() {
        this.client.activate();
    }

    disconnect() {
        this.client.deactivate();
    }

    subscribeToBreaches() {
        this.client.subscribe('/topic/breaches', (message) => {
            const breaches = JSON.parse(message.body);
            store.dispatch(updateBreaches(breaches));
        });
    }

    subscribeToNewBreaches() {
        this.client.subscribe('/topic/new-breach', (message) => {
            const newBreach = JSON.parse(message.body);
            store.dispatch(addNewBreach(newBreach));
        });
    }

    sendBreach(breach) {
        this.client.publish({
            destination: '/app/breaches/add',
            body: JSON.stringify(breach)
        });
    }
}

export default new WebSocketService();
```

### Redux Integration
```typescript
// breachSlice.ts
export const breachSlice = createSlice({
    name: 'breaches',
    initialState: {
        breaches: [],
        newBreaches: []
    },
    reducers: {
        updateBreaches: (state, action) => {
            state.breaches = action.payload;
        },
        addNewBreach: (state, action) => {
            state.breaches.unshift(action.payload);
            state.newBreaches.push(action.payload);
        }
    }
});
```

## Day 5: Error Handling and Notification
### WebSocket Error Handling
```typescript
class WebSocketService {
    // ... previous implementation

    setupErrorHandling() {
        this.client.onWebSocketError((event) => {
            // Log WebSocket errors
            console.error('WebSocket Connection Error', event);
            
            // Dispatch error to Redux
            store.dispatch(setWebSocketError({
                message: 'WebSocket connection lost',
                timestamp: new Date()
            }));

            // Attempt reconnection
            this.reconnect();
        }

        reconnect() {
            setTimeout(() => {
                this.connect();
            }, 5000); // Retry after 5 seconds
        }
    }
}
```

### Notification Component
```jsx
const WebSocketNotification = () => {
    const error = useSelector(state => state.websocket.error);

    return error ? (
        <Alert severity="error">
            WebSocket Connection Error: {error.message}
        </Alert>
    ) : null;
};
```

## Integration Strategies
### Connection Management
- Implement connection/disconnection lifecycle
- Handle network interruptions
- Provide user feedback for connection status

### Data Synchronization
- Implement conflict resolution
- Add timestamps to breaches
- Provide mechanism for manual refresh

## Potential Challenges
- Network instability
- Large data volume
- Authentication with WebSockets
- Browser compatibility

## Best Practices
- Use SockJS for broader browser support
- Implement reconnection logic
- Minimize payload size
- Use compression if possible
- Implement proper error handling

## Deliverables
- Fully functional WebSocket integration
- Real-time breach updates
- Error handling mechanism
- Notification system for connection issues

## Recommended Tools
- Postman for WebSocket testing
- Chrome DevTools
- React DevTools
- Redux DevTools

## Weekend: Review and Refinement
- [ ] Comprehensive testing of WebSocket flows
- [ ] Performance profiling
- [ ] Code review
- [ ] Documentation updates
- [ ] Prepare for next week's advanced features

'use client';
import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, List, ListItem, ListItemText, 
    Divider, Chip, Box, Select, MenuItem, FormControl, 
    InputLabel, Paper, Tabs, Tab 
} from '@mui/material';
import { getPriorityNotifications } from '../utils/priorityLogic';
import { sendLogToServer } from '../logging_middleware/index';

export default function NotificationDashboard() {
    const [notifications, setNotifications] = useState([]);
    const [tabValue, setTabValue] = useState(0); // 0 = All, 1 = Priority
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        // Fetching data using your Stage 1 logic
        const data = await getPriorityNotifications(50); 
        setNotifications(data);
        try {
            await sendLogToServer("frontend", "info", "page", "Dashboard initialized and data loaded");
        } catch (e) {
            console.error("Logging failed:", e.message);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        sendLogToServer("frontend", "info", "ui", `Switched to ${newValue === 0 ? 'All' : 'Priority'} view`).catch(() => {});
    };

    // Logic for Filtering and Priority
    const displayData = notifications
        .filter(n => filterType === 'All' ? true : n.Type === filterType)
        .slice(0, tabValue === 1 ? 10 : notifications.length); // Limit to 10 if Priority tab

    return (
        <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    Campus Notifications
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="All Notifications" />
                        <Tab label="Priority Inbox (Top 10)" />
                    </Tabs>
                </Box>

                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel>Filter by Type</InputLabel>
                    <Select 
                        value={filterType} 
                        label="Filter by Type" 
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <MenuItem value="All">All Types</MenuItem>
                        <MenuItem value="Placement">Placements</MenuItem>
                        <MenuItem value="Result">Results</MenuItem>
                        <MenuItem value="Event">Events</MenuItem>
                    </Select>
                </FormControl>

                <List>
                    {displayData.map((note, index) => (
                        <React.Fragment key={note.ID}>
                            <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                <ListItemText
                                    primary={
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {note.Message}
                                            </Typography>
                                            <Chip 
                                                label={note.Type} 
                                                size="small" 
                                                color={note.Type === 'Placement' ? 'primary' : 'secondary'} 
                                                variant="outlined"
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(note.Timestamp).toLocaleString()}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                            {index < displayData.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                    {displayData.length === 0 && (
                        <Typography variant="body2" sx={{ textAlign: 'center', py: 5, color: 'gray' }}>
                            No notifications found for this category.
                        </Typography>
                    )}
                </List>
            </Paper>
        </Container>
    );
}
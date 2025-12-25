import { Storage, EventBus, Notifications } from './core.js';

class SyncManager {
    constructor() {
        this.config = {
            url: '', // User will fill this
            key: '', // User will fill this
            syncInterval: 30000, // 30 seconds
            syncKey: Storage.get('sync_id_key') || null,
            isSyncing: false,
            lastSync: Storage.get('last_sync_time') || null
        };

        this.syncableKeys = [
            'leads_data', 
            'notes_data', 
            'links_data', 
            'reminders_data', 
            'calc_history', 
            'calendar_events', 
            'app_settings'
        ];
    }

    async initialize() {
        const cloudSettings = Storage.get('cloud_sync_config') || {};
        this.config.url = cloudSettings.url || '';
        this.config.key = cloudSettings.key || '';

        if (!this.config.url || !this.config.key) {
            console.log('SyncManager: Supabase credentials missing.');
            return;
        }

        if (this.config.syncKey) {
            console.log('SyncManager: Initializing auto-sync for key:', this.config.syncKey);
            this.startAutoSync();
            this.listenToLocalChanges();
        }
    }

    listenToLocalChanges() {
        EventBus.on('storage:change', async ({ key, value }) => {
            if (this.syncableKeys.includes(key)) {
                console.log(`SyncManager: Detected local change in [${key}], pushing...`);
                await this.pushData(key, value);
            }
        });
    }

    async pushData(key, data) {
        if (!this.config.syncKey || !this.config.url) return;

        try {
            const response = await fetch(`${this.config.url}/rest/v1/leadsync_data`, {
                method: 'POST',
                headers: {
                    'apikey': this.config.key,
                    'Authorization': `Bearer ${this.config.key}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    user_id: this.config.syncKey,
                    data_key: key,
                    content: data,
                    updated_at: new Date().toISOString()
                })
            });

            if (!response.ok) throw new Error(await response.text());
            
            this.updateLastSync();
            console.log(`SyncManager: Successfully pushed [${key}]`);
        } catch (e) {
            console.error('SyncManager Push Error:', e);
        }
    }

    async pullAll() {
        if (!this.config.syncKey || !this.config.url) return;
        if (this.config.isSyncing) return;

        this.config.isSyncing = true;
        try {
            const response = await fetch(
                `${this.config.url}/rest/v1/leadsync_data?user_id=eq.${this.config.syncKey}`, 
                {
                    headers: {
                        'apikey': this.config.key,
                        'Authorization': `Bearer ${this.config.key}`
                    }
                }
            );

            if (!response.ok) throw new Error(await response.text());

            const remoteData = await response.json();
            let changedCount = 0;

            remoteData.forEach(item => {
                const localData = Storage.get(item.data_key);
                const remoteContent = JSON.stringify(item.content);
                const localContent = JSON.stringify(localData);

                if (remoteContent !== localContent) {
                    console.log(`SyncManager: Updating [${item.data_key}] from remote.`);
                    // Silent update to avoid infinite loop
                    localStorage.setItem(item.data_key, remoteContent);
                    EventBus.emit(`storage:${item.data_key}`, item.content);
                    changedCount++;
                }
            });

            if (changedCount > 0) {
                Notifications.success(`تمت مزامنة ${changedCount} من العناصر الجديدة`);
                EventBus.emit('storage:sync_complete');
            }

            this.updateLastSync();
        } catch (e) {
            console.error('SyncManager Pull Error:', e);
        } finally {
            this.config.isSyncing = false;
        }
    }

    updateLastSync() {
        this.config.lastSync = new Date().toLocaleTimeString('ar-EG');
        Storage.set('last_sync_time', this.config.lastSync);
    }

    startAutoSync() {
        this.pullAll(); // Initial pull
        setInterval(() => this.pullAll(), this.config.syncInterval);
    }

    setSyncKey(key) {
        this.config.syncKey = key;
        Storage.set('sync_id_key', key);
        this.initialize();
    }
}

export const syncManager = new SyncManager();

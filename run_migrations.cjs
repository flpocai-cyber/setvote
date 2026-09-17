const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');
    for (let r of replacements) {
        if (content.includes(r.from)) {
            content = content.replace(r.from, r.to);
            console.log(`Replaced in ${filePath}`);
        } else {
            console.log(`String not found in ${filePath}:\n${r.from.substring(0, 50)}...`);
        }
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

const replacementsAdminDashboard = [
    {
        from: `    useEffect(() => {
        fetchSongs()
        const subscription = subscribeToVotes()
        return () => { supabase.removeChannel(subscription) }
    }, [])`,
        to: `    useEffect(() => {
        fetchSongs()
        const unsubscribe = subscribeToVotes()
        return () => { unsubscribe() }
    }, [])`
    },
    {
        from: `    const fetchSongs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .order('votes', { ascending: false })
            .order('title', { ascending: true })

        const { count, error: profileCountError } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        if (!profileCountError) setProfileCount(count || 0)

        // Fetch sponsors for show registration
        const { data: sponsorsData } = await supabase
            .from('sponsors')
            .select('*')
            .eq('is_active', true)
            .order('is_master', { ascending: false })
            .order('display_order', { ascending: true })
        setSponsors(sponsorsData || [])

        // Fetch pending dedications
        const { data: dedicationsData } = await supabase
            .from('dedications')
            .select('*')
            .eq('is_played', false)
            .order('created_at', { ascending: true })
        setDedications(dedicationsData || [])

        if (error) {
            console.error(error)
            setFetchError(error.message)
        } else {
            setSongs(data)
        }

        // Busca eventos futuros (max 3 mais próximos a partir de hoje)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const today = new Date().toISOString()
            const { data: eventsData, error: eventsError } = await supabase
                .from('future_events')
                .select('*')
                .eq('user_id', user.id)
                .gte('event_date', today)
                .order('event_date', { ascending: true })
                .limit(3)

            if (eventsError) {
                console.error("Error fetching future events:", eventsError)
            } else if (eventsData) {
                setFutureEvents(eventsData)
            }
        }
        setLoading(false)
    }`,
        to: `    const fetchSongs = async () => {
        setLoading(true)
        try {
            const songsSnap = await getDocs(query(collection(db, 'songs'), where('id', '!=', '00000000-0000-0000-0000-000000000000'), orderBy('votes', 'desc'), orderBy('title', 'asc')))
            setSongs(songsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch(e) {
            // fallback if index fails
            const allSongsSnap = await getDocs(collection(db, 'songs'))
            let allSongsData = allSongsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
            allSongsData = allSongsData.filter(s => s.id !== '00000000-0000-0000-0000-000000000000')
            allSongsData.sort((a, b) => (b.votes || 0) - (a.votes || 0) || a.title.localeCompare(b.title))
            setSongs(allSongsData)
        }

        const profilesSnap = await getDocs(collection(db, 'profiles'))
        setProfileCount(profilesSnap.size)

        // Fetch sponsors for show registration
        const sponsorsSnap = await getDocs(query(collection(db, 'sponsors'), where('is_active', '==', true), orderBy('is_master', 'desc'), orderBy('display_order', 'asc')))
        setSponsors(sponsorsSnap.docs.map(d => ({ id: d.id, ...d.data() })))

        // Fetch pending dedications
        const dedicationsSnap = await getDocs(query(collection(db, 'dedications'), where('is_played', '==', false), orderBy('created_at', 'asc')))
        setDedications(dedicationsSnap.docs.map(d => ({ id: d.id, ...d.data() })))

        // Busca eventos futuros (max 3 mais próximos a partir de hoje)
        const user = auth.currentUser
        if (user) {
            const today = new Date().toISOString()
            const eventsSnap = await getDocs(query(collection(db, 'future_events'), where('user_id', '==', user.uid), where('event_date', '>=', today), orderBy('event_date', 'asc'), limit(3)))
            setFutureEvents(eventsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        }
        setLoading(false)
    }`
    },
    {
        from: `    const subscribeToVotes = () => {
        return supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'songs' },
                (payload) => {
                    setSongs(prev => {
                        const index = prev.findIndex(s => s.id === payload.new.id)
                        if (index === -1) return prev
                        const newSongs = [...prev]
                        newSongs[index] = payload.new
                        return newSongs.sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title))
                    })
                }
            )
            .subscribe()
    }`,
        to: `    const subscribeToVotes = () => {
        return onSnapshot(collection(db, 'songs'), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'modified') {
                    const modifiedSong = { id: change.doc.id, ...change.doc.data() }
                    setSongs(prev => {
                        const index = prev.findIndex(s => s.id === modifiedSong.id)
                        if (index === -1) return prev
                        const newSongs = [...prev]
                        newSongs[index] = modifiedSong
                        return newSongs.sort((a, b) => (b.votes || 0) - (a.votes || 0) || a.title.localeCompare(b.title))
                    })
                }
            })
        })
    }`
    },
    {
        from: `    const markAsPlayed = async (song, openSheet = true) => {
        const play_order = songs.filter(s => s.played).length + 1
        const { error } = await supabase
            .from('songs')
            .update({ played: true, play_order })
            .eq('id', song.id)

        if (error) {
            alert('Erro ao marcar como tocada')
        } else {
            if (openSheet && song.sheet_music_url) window.open(song.sheet_music_url, '_blank')
        }
    }`,
        to: `    const markAsPlayed = async (song, openSheet = true) => {
        const play_order = songs.filter(s => s.played).length + 1
        try {
            await updateDoc(doc(db, 'songs', song.id), { played: true, play_order })
            if (openSheet && song.sheet_music_url) window.open(song.sheet_music_url, '_blank')
        } catch(error) {
            alert('Erro ao marcar como tocada')
        }
    }`
    },
    {
        from: `    const markDedicationPlayed = async (dedication) => {
        await supabase.from('dedications').update({ is_played: true }).eq('id', dedication.id)
        fetchSongs()
    }`,
        to: `    const markDedicationPlayed = async (dedication) => {
        await updateDoc(doc(db, 'dedications', dedication.id), { is_played: true })
        fetchSongs()
    }`
    },
    {
        from: `        // Save event sponsors to profile in Supabase
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
            await supabase.from('profiles').update({
                event_sponsors: form.event_sponsors || []
            }).eq('id', authUser.id)
        }`,
        to: `        // Save event sponsors to profile in Firebase
        const authUser = auth.currentUser
        if (authUser) {
            await updateDoc(doc(db, 'profiles', authUser.uid), {
                event_sponsors: form.event_sponsors || []
            })
        }`
    },
    {
        from: `            // 1. Save show to Supabase
            const { data: showRow, error: showErr } = await supabase
                .from('shows')
                .insert({
                    file_key: activeShow.file_key,
                    show_date: activeShow.show_date,
                    venue: activeShow.venue,
                    city: activeShow.city,
                    state: activeShow.state,
                    musician_name: activeShow.musician_name
                })
                .select()
                .single()

            if (showErr) throw showErr

            // 2. Save all songs snapshot
            const allSongs = songs.filter(s => s.votes > 0 || s.played)
            if (allSongs.length > 0) {
                const songRows = allSongs.map(s => ({
                    show_id: showRow.id,
                    song_title: s.title,
                    artist: s.artist,
                    votes: s.votes,
                    played: s.played,
                    play_order: s.play_order
                }))
                const { error: sErr } = await supabase.from('show_songs').insert(songRows)
                if (sErr) throw sErr
            }`,
        to: `            // 1. Save show to Firebase
            const showDocRef = await addDoc(collection(db, 'shows'), {
                file_key: activeShow.file_key,
                show_date: activeShow.show_date,
                venue: activeShow.venue,
                city: activeShow.city,
                state: activeShow.state,
                musician_name: activeShow.musician_name,
                createdAt: serverTimestamp()
            })

            // 2. Save all songs snapshot
            const allSongs = songs.filter(s => s.votes > 0 || s.played)
            if (allSongs.length > 0) {
                for (let s of allSongs) {
                    await addDoc(collection(db, 'show_songs'), {
                        show_id: showDocRef.id,
                        song_title: s.title,
                        artist: s.artist,
                        votes: s.votes,
                        played: s.played,
                        play_order: s.play_order
                    })
                }
            }`
    },
    {
        from: `    const doReset = async () => {
        const { error: songError } = await supabase
            .from('songs')
            .update({ votes: 0, played: false, play_order: null })
            .neq('id', '00000000-0000-0000-0000-000000000000')

        await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
            const now = new Date().toISOString()
            await supabase.from('profiles').upsert({
                id: authUser.id,
                last_reset_at: now,
                updated_at: now,
                event_sponsors: []
            })
        }

        if (songError) throw songError
        fetchSongs()
    }`,
        to: `    const doReset = async () => {
        const songsSnap = await getDocs(collection(db, 'songs'))
        for (let d of songsSnap.docs) {
            if (d.id !== '00000000-0000-0000-0000-000000000000') {
                await updateDoc(doc(db, 'songs', d.id), { votes: 0, played: false, play_order: null })
            }
        }

        const votesSnap = await getDocs(collection(db, 'votes'))
        for (let d of votesSnap.docs) {
            if (d.id !== '00000000-0000-0000-0000-000000000000') {
                await deleteDoc(doc(db, 'votes', d.id))
            }
        }

        const authUser = auth.currentUser
        if (authUser) {
            await setDoc(doc(db, 'profiles', authUser.uid), {
                last_reset_at: serverTimestamp(),
                updated_at: serverTimestamp(),
                event_sponsors: []
            }, { merge: true })
        }
        fetchSongs()
    }`
    }
]

replaceInFile('./src/pages/admin/AdminDashboard.jsx', replacementsAdminDashboard);


// AdminSongs.jsx
const replacementsAdminSongs = [
    {
        from: `    const fetchSongs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .order('title', { ascending: true })
        if (!error) setSongs(data)
        setLoading(false)
    }`,
        to: `    const fetchSongs = async () => {
        setLoading(true)
        try {
            const snapshot = await getDocs(query(collection(db, 'songs'), orderBy('title', 'asc')))
            setSongs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch(e) {
            // fallback
            const snapshot = await getDocs(collection(db, 'songs'))
            let d = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            d.sort((a,b) => a.title.localeCompare(b.title))
            setSongs(d)
        }
        setLoading(false)
    }`
    },
    {
        from: `    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta música?')) {
            const { error } = await supabase.from('songs').delete().eq('id', id)
            if (error) { alert('Erro ao excluir música') }
            else { setSongs(songs.filter(s => s.id !== id)) }
        }
    }`,
        to: `    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta música?')) {
            try {
                await deleteDoc(doc(db, 'songs', id))
                setSongs(songs.filter(s => s.id !== id))
            } catch(error) { alert('Erro ao excluir música') }
        }
    }`
    },
    {
        from: `    const handleToggleActive = async (song) => {
        const { error } = await supabase
            .from('songs')
            .update({ is_active: !song.is_active })
            .eq('id', song.id)
        if (error) { alert('Erro ao atualizar status') }
        else { setSongs(songs.map(s => s.id === song.id ? { ...s, is_active: !s.is_active } : s)) }
    }`,
        to: `    const handleToggleActive = async (song) => {
        try {
            await updateDoc(doc(db, 'songs', song.id), { is_active: !song.is_active })
            setSongs(songs.map(s => s.id === song.id ? { ...s, is_active: !s.is_active } : s))
        } catch(error) { alert('Erro ao atualizar status') }
    }`
    }
]
replaceInFile('./src/pages/admin/AdminSongs.jsx', replacementsAdminSongs);


// AdminSettings.jsx
const replacementsAdminSettings = [
    {
        from: `    const fetchProfile = async () => {
        if (!user) return
        setLoading(true)
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (error && error.code !== 'PGRST116') console.error('Error fetching profile:', error)
        else if (data) setProfile(data)
        setLoading(false)
    }`,
        to: `    const fetchProfile = async () => {
        if (!user) return
        setLoading(true)
        try {
            const docSnap = await getDoc(doc(db, 'profiles', user.uid || user.id))
            if (docSnap.exists()) setProfile(docSnap.data())
        } catch(error) { console.error('Error fetching profile:', error) }
        setLoading(false)
    }`
    },
    {
        from: `            let profile_image_url = profile.profile_image_url
            if (file) {
                const fileExt = file.name.split('.').pop()
                const fileName = \`\${user.id}.\${fileExt}\`
                const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, file, { upsert: true })
                if (uploadError) throw uploadError
                const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(fileName)
                profile_image_url = publicUrl
            }
            const { error } = await supabase.from('profiles').upsert({
                id: user.id, musician_name: profile.musician_name, welcome_text: profile.welcome_text,
                voting_active: profile.voting_active, profile_image_url, pix_key: profile.pix_key,
                pix_name: profile.pix_name, dedication_price: profile.dedication_price,
                dedication_active: profile.dedication_active, updated_at: new Date()
            })
            if (error) throw error`,
        to: `            let profile_image_url = profile.profile_image_url
            if (file) {
                const fileExt = file.name.split('.').pop()
                const fileName = \`\${user.uid || user.id}.\${fileExt}\`
                const storageRef = ref(storage, 'profiles/' + fileName)
                await uploadBytes(storageRef, file)
                profile_image_url = await getDownloadURL(storageRef)
            }
            await setDoc(doc(db, 'profiles', user.uid || user.id), {
                musician_name: profile.musician_name, welcome_text: profile.welcome_text,
                voting_active: profile.voting_active, profile_image_url, pix_key: profile.pix_key,
                pix_name: profile.pix_name, dedication_price: profile.dedication_price,
                dedication_active: profile.dedication_active, updated_at: serverTimestamp()
            }, { merge: true })`
    }
]
replaceInFile('./src/pages/admin/AdminSettings.jsx', replacementsAdminSettings);


// AdminSponsors.jsx
const replacementsAdminSponsors = [
    {
        from: `    const fetchSponsors = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('sponsors').select('*').order('is_master', { ascending: false }).order('display_order', { ascending: true })
        if (!error) setSponsors(data || [])
        setLoading(false)
    }`,
        to: `    const fetchSponsors = async () => {
        setLoading(true)
        try {
            const snapshot = await getDocs(query(collection(db, 'sponsors'), orderBy('is_master', 'desc'), orderBy('display_order', 'asc')))
            setSponsors(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch (error) {
            const snapshot = await getDocs(collection(db, 'sponsors'))
            let d = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            d.sort((a,b) => {
                if(b.is_master !== a.is_master) return b.is_master ? 1 : -1;
                return (a.display_order||0) - (b.display_order||0);
            })
            setSponsors(d)
        }
        setLoading(false)
    }`
    },
    {
        from: `            const ext = file.name.split('.').pop()
            const path = \`sponsor_\${Date.now()}.\${ext}\`
            const { error: upErr } = await supabase.storage.from('sponsors').upload(path, file)
            if (upErr) throw upErr
            const { data: { publicUrl } } = supabase.storage.from('sponsors').getPublicUrl(path)
            const { error: insErr } = await supabase.from('sponsors').insert({
                name: form.name,
                image_url: publicUrl,
                website_url: form.website_url,
                is_active: form.is_active,
                is_master: form.is_master,
                display_order: sponsors.length
            })
            if (insErr) throw insErr`,
        to: `            const ext = file.name.split('.').pop()
            const path = \`sponsor_\${Date.now()}.\${ext}\`
            const storageRef = ref(storage, 'sponsors/' + path)
            await uploadBytes(storageRef, file)
            const publicUrl = await getDownloadURL(storageRef)
            await addDoc(collection(db, 'sponsors'), {
                name: form.name,
                image_url: publicUrl,
                website_url: form.website_url,
                is_active: form.is_active,
                is_master: form.is_master,
                display_order: sponsors.length,
                createdAt: serverTimestamp()
            })`
    },
    {
        from: `    const toggleActive = async (sponsor) => {
        await supabase.from('sponsors').update({ is_active: !sponsor.is_active }).eq('id', sponsor.id)
        fetchSponsors()
    }`,
        to: `    const toggleActive = async (sponsor) => {
        await updateDoc(doc(db, 'sponsors', sponsor.id), { is_active: !sponsor.is_active })
        fetchSponsors()
    }`
    },
    {
        from: `        await supabase.from('sponsors').update({ is_master: becomingMaster }).eq('id', sponsor.id)
        fetchSponsors()`,
        to: `        await updateDoc(doc(db, 'sponsors', sponsor.id), { is_master: becomingMaster })
        fetchSponsors()`
    },
    {
        from: `    const deleteSponsor = async (sponsor) => {
        if (!window.confirm(\`Remover "\${sponsor.name}"?\`)) return
        const urlParts = sponsor.image_url.split('/sponsors/')
        if (urlParts[1]) await supabase.storage.from('sponsors').remove([urlParts[1]])
        await supabase.from('sponsors').delete().eq('id', sponsor.id)
        fetchSponsors()
    }`,
        to: `    const deleteSponsor = async (sponsor) => {
        if (!window.confirm(\`Remover "\${sponsor.name}"?\`)) return
        const urlParts = sponsor.image_url.split('%2F')
        const fileNameMatch = sponsor.image_url.match(/sponsors(?:%2F|\\/)([^?]+)/)
        if (fileNameMatch && fileNameMatch[1]) {
             await deleteObject(ref(storage, 'sponsors/' + fileNameMatch[1]))
        }
        await deleteDoc(doc(db, 'sponsors', sponsor.id))
        fetchSponsors()
    }`
    },
    {
        from: `    const moveOrder = async (index, dir) => {
        const newSponsors = [...sponsors]
        const swap = index + dir
        if (swap < 0 || swap >= newSponsors.length) return;
        [newSponsors[index], newSponsors[swap]] = [newSponsors[swap], newSponsors[index]]
        const updates = newSponsors.map((s, i) => supabase.from('sponsors').update({ display_order: i }).eq('id', s.id))
        await Promise.all(updates)
        fetchSponsors()
    }`,
        to: `    const moveOrder = async (index, dir) => {
        const newSponsors = [...sponsors]
        const swap = index + dir
        if (swap < 0 || swap >= newSponsors.length) return;
        [newSponsors[index], newSponsors[swap]] = [newSponsors[swap], newSponsors[index]]
        const updates = newSponsors.map((s, i) => updateDoc(doc(db, 'sponsors', s.id), { display_order: i }))
        await Promise.all(updates)
        fetchSponsors()
    }`
    }
]
replaceInFile('./src/pages/admin/AdminSponsors.jsx', replacementsAdminSponsors);

// AdminEstatisticas.jsx
const replacementsAdminEstatisticas = [
    {
        from: `    const fetchShows = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('shows').select('*').order('show_date', { ascending: false })
        if (!error) setShows(data || [])
        setLoading(false)
    }`,
        to: `    const fetchShows = async () => {
        setLoading(true)
        try {
            const snapshot = await getDocs(query(collection(db, 'shows'), orderBy('show_date', 'desc')))
            setShows(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch(error) {
            const snapshot = await getDocs(collection(db, 'shows'))
            let d = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            d.sort((a,b) => b.show_date.localeCompare(a.show_date))
            setShows(d)
        }
        setLoading(false)
    }`
    },
    {
        from: `    const loadShowSongs = async (showId) => {
        if (showSongs[showId]) return
        const { data } = await supabase.from('show_songs').select('*').eq('show_id', showId).order('votes', { ascending: false })
        setShowSongs(prev => ({ ...prev, [showId]: data || [] }))
    }`,
        to: `    const loadShowSongs = async (showId) => {
        if (showSongs[showId]) return
        try {
            const snapshot = await getDocs(query(collection(db, 'show_songs'), where('show_id', '==', showId), orderBy('votes', 'desc')))
            setShowSongs(prev => ({ ...prev, [showId]: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) }))
        } catch(error) {
            const snapshot = await getDocs(query(collection(db, 'show_songs'), where('show_id', '==', showId)))
            let d = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            d.sort((a,b) => (b.votes || 0) - (a.votes || 0))
            setShowSongs(prev => ({ ...prev, [showId]: d }))
        }
    }`
    },
    {
        from: `    const handleDelete = async (show) => {
        if (!window.confirm(\`Tem certeza que deseja excluir permanentemente o show "\${show.file_key}"?\\n\\nEsta ação não pode ser desfeita.\`)) return
        const { error } = await supabase.from('shows').delete().eq('id', show.id)
        if (error) { alert('Erro ao excluir show: ' + error.message); return }
        setShows(prev => prev.filter(s => s.id !== show.id))
    }`,
        to: `    const handleDelete = async (show) => {
        if (!window.confirm(\`Tem certeza que deseja excluir permanentemente o show "\${show.file_key}"?\\n\\nEsta ação não pode ser desfeita.\`)) return
        try {
            await deleteDoc(doc(db, 'shows', show.id))
            setShows(prev => prev.filter(s => s.id !== show.id))
        } catch(error) { alert('Erro ao excluir show: ' + error.message) }
    }`
    },
    {
        from: `            const { error } = await supabase.from('shows').update({ show_date: editingShow.show_date, venue: editingShow.venue, city: editingShow.city, state: editingShow.state, musician_name: editingShow.musician_name, file_key: newFileKey }).eq('id', editingShow.id)
            if (error) throw error`,
        to: `            await updateDoc(doc(db, 'shows', editingShow.id), { show_date: editingShow.show_date, venue: editingShow.venue, city: editingShow.city, state: editingShow.state, musician_name: editingShow.musician_name, file_key: newFileKey })`
    }
]
replaceInFile('./src/pages/admin/AdminEstatisticas.jsx', replacementsAdminEstatisticas);

// AdminPagantes.jsx
const replacementsAdminPagantes = [
    {
        from: `    const fetchDedications = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('dedications')
            .select('*')
            .order('created_at', { ascending: false })
        setDedications(data || [])
        setLoading(false)
    }`,
        to: `    const fetchDedications = async () => {
        setLoading(true)
        try {
            const snapshot = await getDocs(query(collection(db, 'dedications'), orderBy('created_at', 'desc')))
            setDedications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch(e) {
            const snapshot = await getDocs(collection(db, 'dedications'))
            let d = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            d.sort((a,b) => b.created_at?.toMillis() - a.created_at?.toMillis() || 0)
            setDedications(d)
        }
        setLoading(false)
    }`
    },
    {
        from: `    const markAsPlayed = async (id) => {
        await supabase.from('dedications').update({ is_played: true }).eq('id', id)
        fetchDedications()
    }`,
        to: `    const markAsPlayed = async (id) => {
        await updateDoc(doc(db, 'dedications', id), { is_played: true })
        fetchDedications()
    }`
    },
    {
        from: `    const deleteReceipt = async (dedication) => {
        if (!window.confirm('Excluir comprovante? Os dados do pagante serão mantidos.')) return
        if (dedication.receipt_url) {
            const urlParts = dedication.receipt_url.split('/dedications/')
            if (urlParts[1]) {
                await supabase.storage.from('dedications').remove([urlParts[1]])
            }
        }
        await supabase.from('dedications').update({ receipt_url: null }).eq('id', dedication.id)
        fetchDedications()
    }`,
        to: `    const deleteReceipt = async (dedication) => {
        if (!window.confirm('Excluir comprovante? Os dados do pagante serão mantidos.')) return
        if (dedication.receipt_url) {
            const fileNameMatch = dedication.receipt_url.match(/dedications(?:%2F|\\/)([^?]+)/)
            if (fileNameMatch && fileNameMatch[1]) {
                await deleteObject(ref(storage, 'dedications/' + fileNameMatch[1]))
            }
        }
        await updateDoc(doc(db, 'dedications', dedication.id), { receipt_url: null })
        fetchDedications()
    }`
    }
]
replaceInFile('./src/pages/admin/AdminPagantes.jsx', replacementsAdminPagantes);

// AdminFutureEvents.jsx
const replacementsAdminFutureEvents = [
    {
        from: `    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setUserId(user.id)
    }`,
        to: `    const checkUser = async () => {
        const user = auth.currentUser
        if (user) setUserId(user.uid)
    }`
    },
    {
        from: `    const fetchEvents = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('future_events').select('*').order('event_date', { ascending: true })
        if (!error && data) setEvents(data)
        setLoading(false)
    }`,
        to: `    const fetchEvents = async () => {
        setLoading(true)
        try {
            const snapshot = await getDocs(query(collection(db, 'future_events'), orderBy('event_date', 'asc')))
            setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        } catch(error) {
            const snapshot = await getDocs(collection(db, 'future_events'))
            let d = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
            d.sort((a,b) => a.event_date.localeCompare(b.event_date))
            setEvents(d)
        }
        setLoading(false)
    }`
    },
    {
        from: `            const token = crypto.randomUUID()
            const { error } = await supabase.from('future_events').insert({ user_id: userId, title: formTitle, event_date: eventDateTime, venue: formVenue, token, is_active: true })
            if (error) throw error`,
        to: `            const token = crypto.randomUUID()
            await addDoc(collection(db, 'future_events'), { user_id: userId, title: formTitle, event_date: eventDateTime, venue: formVenue, token, is_active: true, createdAt: serverTimestamp() })`
    },
    {
        from: `    const toggleActive = async (event) => {
        await supabase.from('future_events').update({ is_active: !event.is_active }).eq('id', event.id)
        fetchEvents()
    }`,
        to: `    const toggleActive = async (event) => {
        await updateDoc(doc(db, 'future_events', event.id), { is_active: !event.is_active })
        fetchEvents()
    }`
    },
    {
        from: `    const deleteEvent = async (event) => {
        if (!window.confirm(\`Tem certeza que deseja excluir o evento "\${event.title}"?\\nTodos os votos associados a ele também serão perdidos.\`)) return
        const { error } = await supabase.from('future_events').delete().eq('id', event.id)
        if (!error) fetchEvents(); else alert("Erro ao excluir: " + error.message)
    }`,
        to: `    const deleteEvent = async (event) => {
        if (!window.confirm(\`Tem certeza que deseja excluir o evento "\${event.title}"?\\nTodos os votos associados a ele também serão perdidos.\`)) return
        try {
            await deleteDoc(doc(db, 'future_events', event.id))
            fetchEvents()
        } catch(error) { alert("Erro ao excluir: " + error.message) }
    }`
    }
]
replaceInFile('./src/pages/admin/AdminFutureEvents.jsx', replacementsAdminFutureEvents);

// AdminEventList.jsx
const replacementsAdminEventList = [
    {
        from: `    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) navigate('/admin'); else fetchEventData()
    }`,
        to: `    const checkAuth = async () => {
        const user = auth.currentUser
        if (!user) navigate('/admin'); else fetchEventData()
    }`
    },
    {
        from: `    const fetchEventData = async () => {
        setLoading(true)
        try {
            const { data: eventData, error: eventError } = await supabase.from('future_events').select('*').eq('token', token).single()
            if (eventError || !eventData) { alert('Evento não encontrado.'); navigate('/admin/eventos-futuros'); return }
            setEvent(eventData)
            const { data: songsData, error: songsError } = await supabase.from('songs').select('*').eq('is_active', true)
            if (songsError) throw songsError
            setSongs(songsData || [])
            await fetchVotes(eventData.id)
            subscribeToVotes(eventData.id)
        } catch (err) { console.error(err); alert('Erro ao carregar os dados do evento.'); navigate('/admin/eventos-futuros') }
        finally { setLoading(false) }
    }`,
        to: `    const fetchEventData = async () => {
        setLoading(true)
        try {
            const eventsSnap = await getDocs(query(collection(db, 'future_events'), where('token', '==', token), limit(1)))
            if (eventsSnap.empty) { alert('Evento não encontrado.'); navigate('/admin/eventos-futuros'); return }
            const eventData = { id: eventsSnap.docs[0].id, ...eventsSnap.docs[0].data() }
            setEvent(eventData)
            const songsSnap = await getDocs(query(collection(db, 'songs'), where('is_active', '==', true)))
            setSongs(songsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
            await fetchVotes(eventData.id)
            window._unsubscribeVotes = subscribeToVotes(eventData.id)
        } catch (err) { console.error(err); alert('Erro ao carregar os dados do evento.'); navigate('/admin/eventos-futuros') }
        finally { setLoading(false) }
    }`
    },
    {
        from: `    const fetchVotes = async (eventId) => {
        const { data } = await supabase.from('future_event_votes').select('song_id, votes').eq('event_id', eventId)
        if (data) {
            const votesMap = {}
            data.forEach(v => { votesMap[v.song_id] = v.votes })
            setVotes(votesMap)
        }
    }`,
        to: `    const fetchVotes = async (eventId) => {
        const snapshot = await getDocs(query(collection(db, 'future_event_votes'), where('event_id', '==', eventId)))
        const votesMap = {}
        snapshot.docs.forEach(d => { votesMap[d.data().song_id] = d.data().votes })
        setVotes(votesMap)
    }`
    },
    {
        from: `    const subscribeToVotes = (eventId) => {
        supabase.channel(\`admin:event_votes:\${eventId}\`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'future_event_votes', filter: \`event_id=eq.\${eventId}\` },
                (payload) => { if (payload.new?.song_id) setVotes(prev => ({ ...prev, [payload.new.song_id]: payload.new.votes })) })
            .subscribe()
    }`,
        to: `    const subscribeToVotes = (eventId) => {
        return onSnapshot(query(collection(db, 'future_event_votes'), where('event_id', '==', eventId)), (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    setVotes(prev => ({ ...prev, [change.doc.data().song_id]: change.doc.data().votes }))
                }
            })
        })
    }`
    },
    {
        from: `        try {
            setLoading(true)
            await supabase.from('songs').update({ votes: 0, played: false, play_order: null }).neq('id', '00000000-0000-0000-0000-000000000000')
            const votedSongs = songs.filter(song => votes[song.id] > 0)
            await Promise.all(votedSongs.map(song => supabase.from('songs').update({ votes: votes[song.id] }).eq('id', song.id)))
            const fileKey = \`\${event.title.replace(/\\s+/g, '').substring(0, 10).toUpperCase()}-EVENTO\`
            localStorage.setItem('activeShow', JSON.stringify({ show_date: event.event_date.split('T')[0], venue: event.venue || 'Evento', city: '', state: '', musician_name: '', file_key: fileKey }))
            navigate('/admin/dashboard')
        } catch (error) { console.error(error); alert('Erro ao iniciar show: ' + error.message); setLoading(false) }`,
        to: `        try {
            setLoading(true)
            const songsSnap = await getDocs(collection(db, 'songs'))
            for (let d of songsSnap.docs) {
                if (d.id !== '00000000-0000-0000-0000-000000000000') {
                    await updateDoc(doc(db, 'songs', d.id), { votes: 0, played: false, play_order: null })
                }
            }
            const votedSongs = songs.filter(song => votes[song.id] > 0)
            await Promise.all(votedSongs.map(song => updateDoc(doc(db, 'songs', song.id), { votes: votes[song.id] })))
            const fileKey = \`\${event.title.replace(/\\s+/g, '').substring(0, 10).toUpperCase()}-EVENTO\`
            localStorage.setItem('activeShow', JSON.stringify({ show_date: event.event_date.split('T')[0], venue: event.venue || 'Evento', city: '', state: '', musician_name: '', file_key: fileKey }))
            navigate('/admin/dashboard')
        } catch (error) { console.error(error); alert('Erro ao iniciar show: ' + error.message); setLoading(false) }`
    }
]
replaceInFile('./src/pages/admin/AdminEventList.jsx', replacementsAdminEventList);

// SongModal.jsx
const replacementsSongModal = [
    {
        from: `        const { error: uploadError, data } = await supabase.storage
            .from(bucket)
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return publicUrl`,
        to: `        const storageRef = ref(storage, \`\${bucket}/\${filePath}\`)
        await uploadBytes(storageRef, file)
        return await getDownloadURL(storageRef)`
    },
    {
        from: `            if (song) {
                const { error } = await supabase
                    .from('songs')
                    .update(songData)
                    .eq('id', song.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('songs')
                    .insert([songData])
                if (error) throw error
            }`,
        to: `            if (song) {
                await updateDoc(doc(db, 'songs', song.id), songData)
            } else {
                await addDoc(collection(db, 'songs'), { ...songData, createdAt: serverTimestamp() })
            }`
    }
]
replaceInFile('./src/components/admin/SongModal.jsx', replacementsSongModal);

// ShowRegistrationModal.jsx
const replacementsShowRegistrationModal = [
    {
        from: `            const path = \`sponsor_custom_\${Date.now()}.\${ext}\`
            const { error: upErr } = await supabase.storage.from('sponsors').upload(path, f)
            if (upErr) throw upErr
            const { data: { publicUrl } } = supabase.storage.from('sponsors').getPublicUrl(path)
            setCustomForm(p => ({ ...p, image_url: publicUrl }))`,
        to: `            const path = \`sponsor_custom_\${Date.now()}.\${ext}\`
            const storageRef = ref(storage, 'sponsors/' + path)
            await uploadBytes(storageRef, f)
            const publicUrl = await getDownloadURL(storageRef)
            setCustomForm(p => ({ ...p, image_url: publicUrl }))`
    }
]
replaceInFile('./src/components/admin/ShowRegistrationModal.jsx', replacementsShowRegistrationModal);
console.log("All replacements finished");

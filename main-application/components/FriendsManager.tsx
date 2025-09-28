"use client"

import { useState, useEffect } from "react"
import { useHypergraphApp } from '@graphprotocol/hypergraph-react'
import { useSelector } from "@xstate/store/react"
import { store } from "@graphprotocol/hypergraph"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Users, UserPlus, Send, CheckCircle, Clock, X, Mail } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Friend {
  name: string
  spaceId: string
}

interface Invitation {
  id: string
  spaceId: string
  space: string
  inviter: {
    accountAddress: string
  }
  invitee: {
    accountAddress: string
  }
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  previousEventHash: string
}

export default function FriendsManager() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [newFriendName, setNewFriendName] = useState("")
  const [newFriendAddress, setNewFriendAddress] = useState("")
  const [selectedSpaceId, setSelectedSpaceId] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const { inviteToSpace, listInvitations, acceptInvitation } = useHypergraphApp()
  
  // Get invitations from the store
  const invitations = useSelector(store, (state: any) => state.context.invitations) as Invitation[] || []

  // Check connection state from the store
  const connectionState = useSelector(store, (state: any) => state.context.connectionState)

  // Load friends from localStorage on mount and handle connection
  useEffect(() => {
    loadFriendsFromStorage()
    
    // Check if we're connected before trying to list invitations
    if (connectionState === 'connected' || isConnected) {
      loadInvitationsSafely()
    }
  }, [connectionState, isConnected])

  // Separate effect to monitor connection state
  useEffect(() => {
    const checkConnection = () => {
      // Simple way to check if we can make hypergraph calls
      try {
        const state = store.getSnapshot()
        if (state?.context?.connectionState === 'connected') {
          setIsConnected(true)
          loadInvitationsSafely()
        }
      } catch (error) {
        console.log('Connection not ready yet:', error)
      }
    }

    // Check immediately
    checkConnection()
    
    // Set up interval to check periodically
    const interval = setInterval(checkConnection, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const loadInvitationsSafely = async () => {
    try {
      await listInvitations()
    } catch (error) {
      console.error('Error loading invitations:', error)
      // Don't show error to user on initial load - it's expected if not connected
    }
  }

  const loadFriendsFromStorage = () => {
    try {
      const savedFriends = localStorage.getItem('friends')
      if (savedFriends) {
        const friendsData = JSON.parse(savedFriends)
        // Convert object to array format
        const friendsArray = Object.entries(friendsData).map(([name, spaceId]) => ({
          name,
          spaceId: spaceId as string
        }))
        setFriends(friendsArray)
      }
    } catch (error) {
      console.error('Error loading friends from storage:', error)
    }
  }

  const saveFriendsToStorage = (friendsArray: Friend[]) => {
    try {
      // Convert array to object format for localStorage
      const friendsObject = friendsArray.reduce((acc, friend) => {
        acc[friend.name] = friend.spaceId
        return acc
      }, {} as Record<string, string>)
      localStorage.setItem('friends', JSON.stringify(friendsObject))
    } catch (error) {
      console.error('Error saving friends to storage:', error)
    }
  }

  const handleSendInvitation = async () => {
    console.log("alkdfjaskdfhaskfdasdfsjaskfdjssssssssssssssssssssss");
    if (!newFriendName.trim() || !newFriendAddress.trim() || !selectedSpaceId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to send an invitation.",
        variant: "destructive",
      })
      return
    }

    console.log("ghghghghghg");

    // Check if connected
    // if (!isConnected) {
    //   toast({
    //     title: "Connection Error",
    //     description: "Not connected to Hypergraph. Please wait for connection to be established.",
    //     variant: "destructive",
    //   })
    //   return
    // }

    console.log("alkdfjaskdfhaskfdjaskfdj");
    // Validate address format
    if (!newFriendAddress.startsWith('0x') || newFriendAddress.length !== 42) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum address (0x...)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await inviteToSpace({
        space: { id: selectedSpaceId } as any, // Using any to bypass type checking for now
        invitee: {
          accountAddress: newFriendAddress as `0x${string}`,
        },
      })

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${newFriendName} successfully!`,
      })

      // Clear form
      setNewFriendName("")
      setNewFriendAddress("")
      setSelectedSpaceId("")
      setIsInviteDialogOpen(false)
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast({
        title: "Failed to Send Invitation",
        description: "There was an error sending the invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvitation = async (invitation: Invitation) => {
    setIsLoading(true)
    try {
      await acceptInvitation({
        invitation: {
          id: invitation.id,
          spaceId: invitation.spaceId,
          previousEventHash: invitation.previousEventHash
        },
      })

      // Add to friends list - we'll use the inviter's address as a placeholder name
      // In a real app, you might want to fetch the user's name from their profile
      const friendName = `Friend-${invitation.inviter.accountAddress.slice(0, 6)}`
      const newFriend: Friend = {
        name: friendName,
        spaceId: invitation.space || invitation.spaceId
      }

      const updatedFriends = [...friends, newFriend]
      setFriends(updatedFriends)
      saveFriendsToStorage(updatedFriends)

      toast({
        title: "Invitation Accepted",
        description: `You are now friends with ${friendName}!`,
      })

      // Refresh invitations list safely
      loadInvitationsSafely()
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast({
        title: "Failed to Accept Invitation",
        description: "There was an error accepting the invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeFriend = (friendToRemove: Friend) => {
    const updatedFriends = friends.filter(friend => 
      friend.name !== friendToRemove.name || friend.spaceId !== friendToRemove.spaceId
    )
    setFriends(updatedFriends)
    saveFriendsToStorage(updatedFriends)
    
    toast({
      title: "Friend Removed",
      description: `${friendToRemove.name} has been removed from your friends list.`,
    })
  }

  const pendingInvitations = invitations?.filter(inv => inv.status === 'pending') || []

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends Manager
        </CardTitle>
        <CardDescription>
          Manage your friends, send invitations, and accept incoming requests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              My Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="invite">
              Send Invite
            </TabsTrigger>
            <TabsTrigger value="invitations">
              Invitations ({pendingInvitations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Friends</h3>
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friend
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite a Friend</DialogTitle>
                    <DialogDescription>
                      Send a space invitation to a friend by entering their details.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="friendName">Friend's Name</Label>
                      <Input
                        id="friendName"
                        value={newFriendName}
                        onChange={(e) => setNewFriendName(e.target.value)}
                        placeholder="Enter friend's name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="friendAddress">Friend's Address</Label>
                      <Input
                        id="friendAddress"
                        value={newFriendAddress}
                        onChange={(e) => setNewFriendAddress(e.target.value)}
                        placeholder="0x1234567890123456789012345678901234567890"
                      />
                    </div>
                    <div>
                      <Label htmlFor="spaceId">Space ID to Invite To</Label>
                      <Input
                        id="spaceId"
                        value={selectedSpaceId}
                        onChange={(e) => setSelectedSpaceId(e.target.value)}
                        placeholder="Enter space ID"
                      />
                    </div>
                    <Button 
                      onClick={handleSendInvitation} 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {friends.length > 0 ? (
              <div className="grid gap-3">
                {friends.map((friend, index) => (
                  <div
                    key={`${friend.name}-${friend.spaceId}-${index}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{friend.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Space: {friend.spaceId.slice(0, 8)}...{friend.spaceId.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFriend(friend)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Friends Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your network by sending invitations to friends.
                </p>
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Your First Friend
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="invite" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Send Space Invitation</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="inviteFriendName">Friend's Name</Label>
                  <Input
                    id="inviteFriendName"
                    value={newFriendName}
                    onChange={(e) => setNewFriendName(e.target.value)}
                    placeholder="Enter friend's name"
                  />
                </div>
                <div>
                  <Label htmlFor="inviteFriendAddress">Friend's Address</Label>
                  <Input
                    id="inviteFriendAddress"
                    value={newFriendAddress}
                    onChange={(e) => setNewFriendAddress(e.target.value)}
                    placeholder="0x1234567890123456789012345678901234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="inviteSpaceId">Space ID to Invite To</Label>
                  <Input
                    id="inviteSpaceId"
                    value={selectedSpaceId}
                    onChange={(e) => setSelectedSpaceId(e.target.value)}
                    placeholder="Enter space ID"
                  />
                </div>
                <Button 
                  onClick={handleSendInvitation} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Pending Invitations</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadInvitationsSafely()}
              >
                <Mail className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {pendingInvitations.length > 0 ? (
              <div className="grid gap-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Space Invitation</p>
                        <p className="text-sm text-muted-foreground">
                          From: {invitation.inviter.accountAddress.slice(0, 6)}...{invitation.inviter.accountAddress.slice(-6)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Space: {invitation.space.slice(0, 8)}...{invitation.space.slice(-8)}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvitation(invitation)}
                        disabled={isLoading}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
                <p className="text-muted-foreground">
                  You don't have any pending space invitations at the moment.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Dorm.Api.Hubs;

public class MaintenanceHub : Hub
{
    public async Task JoinTicketRoom(string ticketId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, ticketId);
    }

    public async Task LeaveTicketRoom(string ticketId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, ticketId);
    }
}

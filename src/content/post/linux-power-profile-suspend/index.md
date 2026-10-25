---
title: 'Keeping a tuned power profile after suspend on Linux'
description: 'After suspend, my laptop dropped its tuned powersave profile. A systemd unit on sleep.target sets it again on wake, and another logs battery drain.'
publishDate: '23 October 2026'
tags: ['linux', 'systemd', 'power-management', 'troubleshooting']
coverImage:
  src: ./cover.webp
  alt: 'Four steps in order: sleep.target starts, systemd-suspend.service keeps the machine asleep, sleep.target stops on wake, then ExecStop runs tuned-adm profile powersave'
draft: true
---

In April 2025 my laptop ran tuned on the `powersave` profile, and after it woke from suspend it wasn't on that profile any more. I fixed it with a small systemd unit that sets the profile again after resume, then wrote a second one to log how much battery the laptop lost while it slept.

Reading both notes again now, the first fix works for suspend but carries two steps it doesn't need and misses hibernate. The battery logger never worked: the shell in my note had been URL-encoded somewhere along the way. This post is the cleaned-up version of both, with what I changed and why.

> **Key Takeaways**
>
> - A unit with `After=suspend.target` and `WantedBy=suspend.target` runs after wake, because `suspend.target` is ordered after `systemd-suspend.service`, which only finishes once the machine is awake again.
> - The documented pattern is one unit ordered `Before=sleep.target` with the after-wake command in `ExecStop=`. It covers suspend, hibernate, hybrid sleep and suspend-then-hibernate.
> - A system unit already runs as root, so `sudo` inside it and a `NOPASSWD` rule for `tuned-adm` aren't needed.
> - The same unit shape, with `ExecStart=` before sleep and `ExecStop=` after wake, logs battery level across each sleep to a CSV file.

## The original fix

My first version had three parts: a script, a sudoers rule and a unit. The script was one line:

```bash
#!/bin/bash
# /usr/local/bin/set-powersave.sh
/usr/bin/sudo /usr/sbin/tuned-adm profile powersave
```

The sudoers rule, added with `sudo visudo`, let my user run `tuned-adm` without a password:

```text
saf1 ALL=(ALL) NOPASSWD: /usr/sbin/tuned-adm
```

And the unit, in `/etc/systemd/system/set-powersave-after-resume.service`:

```ini
[Unit]
Description=Set tuned profile to powersave after resume
After=suspend.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/set-powersave.sh

[Install]
WantedBy=suspend.target
```

I enabled it with `sudo systemctl enable set-powersave-after-resume.service`. The test in my note was to run `systemctl suspend`, wake the laptop, and check that `tuned-adm active` printed `Current active profile: powersave`.

## Why After=suspend.target means after wake

It looks odd that a unit ordered after `suspend.target` runs when the machine comes back, not when it goes down. The stock units explain it. This is `systemctl cat` on my desktop (systemd 262, license comments trimmed):

```bash
systemctl cat sleep.target suspend.target systemd-suspend.service
```

```ini
# /usr/lib/systemd/system/sleep.target
[Unit]
Description=Sleep
Documentation=man:systemd.special(7)
DefaultDependencies=no
RefuseManualStart=yes
StopWhenUnneeded=yes

# /usr/lib/systemd/system/suspend.target
[Unit]
Description=Suspend
Documentation=man:systemd.special(7)
DefaultDependencies=no
Requires=systemd-suspend.service
After=systemd-suspend.service
StopWhenUnneeded=yes

# /usr/lib/systemd/system/systemd-suspend.service
[Unit]
Description=System Suspend
Documentation=man:systemd-suspend.service(8)
DefaultDependencies=no
Requires=sleep.target
After=sleep.target

[Service]
Type=oneshot
ExecStart=/usr/lib/systemd/systemd-sleep suspend
```

The chain is `sleep.target`, then `systemd-suspend.service`, then `suspend.target`. `systemd-suspend.service` is a oneshot that runs `systemd-sleep suspend`, and that command doesn't return until the machine wakes. So `suspend.target` is only reached after resume, and anything ordered after it runs then.

## What I changed

**`sudo` inside the unit does nothing useful.** System units run as root unless they set `User=`, so the script was root calling `sudo` to become root. The `NOPASSWD` line wasn't used by the unit at all. It only let my user switch tuned profiles without a password, which I didn't need. If you added it, take it out with `sudo visudo`.

**The wrapper script isn't needed either.** `ExecStart=` and `ExecStop=` can run `tuned-adm` directly.

**It only covered suspend.** Hibernate, hybrid sleep and suspend-then-hibernate go through their own targets, so the profile wouldn't come back after those. My note had a tip for this: change `suspend.target` to `sleep.target`. That tip is wrong. `systemd-suspend.service` is ordered `After=sleep.target`, so `sleep.target` is reached before the machine sleeps. A unit ordered after it would run on the way down, racing the suspend itself.

The pattern for "before sleep and after wake" is in [systemd.special(7)](https://www.freedesktop.org/software/systemd/man/latest/systemd.special.html#sleep.target), under `sleep.target`: put the before-sleep command in `ExecStart=`, the after-wake command in `ExecStop=`, order the unit `Before=sleep.target`, and set `StopWhenUnneeded=yes` and `RemainAfterExit=yes`. All four sleep types pull in `sleep.target`, so one unit covers them.

## The corrected unit

Nothing needs to happen before sleep here, so the unit has only an `ExecStop=`. [systemd.service(5)](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html#ExecStart=) allows that for a oneshot with `RemainAfterExit=yes`.

```bash
sudo tee /etc/systemd/system/tuned-powersave-resume.service > /dev/null <<'EOF'
[Unit]
Description=Reapply the tuned powersave profile after waking up
DefaultDependencies=no
StopWhenUnneeded=yes
Before=sleep.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStop=/usr/sbin/tuned-adm profile powersave

[Install]
WantedBy=sleep.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable tuned-powersave-resume.service
```

Here's what happens on each sleep. `sleep.target` starts and pulls the unit in. It has no `ExecStart=`, so it just becomes active. The machine sleeps. On wake, `sleep.target` stops because nothing needs it any more, the unit stops with it, and its `ExecStop=` sets the profile.

Enable it, but don't `systemctl start` it by hand. Started outside a sleep, nothing keeps it wanted, so it stops again straight away.

`tuned-adm` is at `/usr/sbin/tuned-adm` on the laptop I wrote this for. Check yours with `command -v tuned-adm`. `powersave` is one of tuned's stock profiles, described in [tuned-profiles(7)](https://man.archlinux.org/man/extra/tuned/tuned-profiles.7.en); `tuned-adm list` shows the ones you have.

To remove the old version first:

```bash
sudo systemctl disable set-powersave-after-resume.service
sudo rm /etc/systemd/system/set-powersave-after-resume.service /usr/local/bin/set-powersave.sh
sudo systemctl daemon-reload
```

My note also had a reminder for SELinux systems: if systemd won't load the unit, check its label with `ls -Z` and reset it with `sudo restorecon -v` on the file.

## Check it after a wake

Suspend, wake the machine, then:

```bash
tuned-adm active
journalctl -b -u tuned-powersave-resume.service
```

`tuned-adm active` should print `Current active profile: powersave`, and the journal should show the unit stopping right after the resume.

## Logging battery drain while asleep

A few days later I wanted to know how much battery the laptop lost overnight. The note I saved for that had two broken lines. Where the shell should say `2>/dev/null` it said `2%3E/dev/null`, and where it should read a file with `<` it said `%3C`.

Neither fails loudly. `cat` treats `2%3E/dev/null` as a second file name, can't find it, exits with an error, and the `||` fallback runs as well. The `read` line is worse:

```bash
read PERCENT_BEFORE ENERGY_BEFORE TIME_BEFORE %3C /tmp/battery-before-sleep.log
```

```text
bash: read: `%3C': not a valid identifier
```

Nothing gets read, so every calculation after it works on empty values. The same note also divided by the sleep time after rounding it to two decimals of an hour, so a short sleep became a division by zero.

## A drain logger that works

One script, called with `pre` before sleep and `post` after wake, and one unit of the same shape as the tuned one. It reads the battery from sysfs. The kernel reports `capacity` in percent, `energy_now` in µWh and `charge_now` in µAh, according to the [power supply class docs](https://docs.kernel.org/power/power_supply_class.html). Some batteries only expose the charge values, so the script uses whichever is there and records which one it used.

```bash
sudo tee /usr/local/bin/sleep-battery-log > /dev/null <<'EOF'
#!/bin/bash
# Called with "pre" before sleep and "post" after waking.
# Writes one CSV row per sleep to /var/log/sleep-battery.csv.
set -eu

state=/run/sleep-battery.state
log=/var/log/sleep-battery.csv

# Use the first power supply whose type is Battery (BAT0, BAT1, CMB0...)
bat=
for d in /sys/class/power_supply/*; do
    if [ "$(cat "$d/type" 2>/dev/null)" = Battery ]; then
        bat=$d
        break
    fi
done
[ -n "$bat" ] || exit 0

# energy_now is in µWh; some batteries only report charge_now, in µAh
if [ -r "$bat/energy_now" ]; then
    unit=uWh
    now=$(cat "$bat/energy_now")
else
    unit=uAh
    now=$(cat "$bat/charge_now")
fi
pct=$(cat "$bat/capacity")
t=$(date +%s)

case "${1:-}" in
pre)
    echo "$t $pct $now" > "$state"
    ;;
post)
    [ -r "$state" ] || exit 0
    read -r t0 pct0 now0 < "$state"
    rm -f "$state"
    [ -e "$log" ] || echo "slept_at,woke_at,hours,pct_before,pct_after,unit,before,after,lost_per_hour" > "$log"
    awk -v t0="$t0" -v t1="$t" -v p0="$pct0" -v p1="$pct" -v u="$unit" -v a="$now0" -v b="$now" \
        -v s="$(date -Is -d "@$t0")" -v w="$(date -Is -d "@$t")" 'BEGIN {
        h = (t1 - t0) / 3600
        rate = (h > 0) ? (a - b) / h : 0
        printf "%s,%s,%.2f,%d,%d,%s,%d,%d,%.0f\n", s, w, h, p0, p1, u, a, b, rate
    }' >> "$log"
    ;;
*)
    echo "usage: $0 pre|post" >&2
    exit 2
    ;;
esac
EOF
sudo chmod 755 /usr/local/bin/sleep-battery-log
```

The rate is worked out from seconds, not rounded hours, and a zero-length sleep logs a rate of 0 instead of failing. The state file lives in `/run`, which is in memory, so it survives a suspend and is cleared on reboot.

The unit:

```bash
sudo tee /etc/systemd/system/sleep-battery-log.service > /dev/null <<'EOF'
[Unit]
Description=Log battery level across sleep
DefaultDependencies=no
StopWhenUnneeded=yes
Before=sleep.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/bin/sleep-battery-log pre
ExecStop=/usr/local/bin/sleep-battery-log post

[Install]
WantedBy=sleep.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable sleep-battery-log.service
```

`daemon-reload` is enough after adding a unit. My old note also ran `daemon-reexec`, which restarts the systemd manager itself and isn't needed for this. If you installed the old pair of units from that note, disable them first: `sudo systemctl disable log-sleep-battery.service calc-sleep-battery-loss.service`.

## Reading the log

Each sleep adds one row to `/var/log/sleep-battery.csv`:

```text
slept_at,woke_at,hours,pct_before,pct_after,unit,before,after,lost_per_hour
```

When `unit` is `uWh`, `lost_per_hour` is µWh lost per hour, which is the average draw in µW. Divide it by 1,000,000 for watts. When it's `uAh`, the rate is in µA instead, and you'd need the battery voltage to turn it into watts. If the charger was plugged in during the sleep, the numbers can go negative.

The CSV keeps one row per night, so it's easy to open in a spreadsheet or plot later.
